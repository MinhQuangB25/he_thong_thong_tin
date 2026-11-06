package vn.binhannhrm.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrint;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(print = MockMvcPrint.NONE)
@Transactional
class AuditRegressionTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired AppUserRepository users;
    @Autowired vn.binhannhrm.domain.EmployeeRepository employees;

    private String token(String username) throws Exception {
        var result = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(new AuthDtos.LoginRequest(username, "password"))))
                .andExpect(status().isOk()).andReturn();
        return "Bearer " + json.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test void lockingAccountRevokesExistingAccessToken() throws Exception {
        String authorization = token("employee01");
        var user = users.findByUsername("employee01").orElseThrow();
        user.setStatus(AccountStatus.LOCKED);
        users.saveAndFlush(user);
        mvc.perform(get("/api/v1/auth/me").header("Authorization", authorization))
                .andExpect(status().isUnauthorized());
    }

    @Test void historicalReportExcludesPeopleNotYetHired() throws Exception {
        mvc.perform(get("/api/v1/reports/employees?month=1&year=1900").header("Authorization", token("admin")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalEmployees").value(0));
    }

    @Test void missingAttendanceDatesIsBadRequest() throws Exception {
        mvc.perform(get("/api/v1/attendance").header("Authorization", token("admin")))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.status").value(400));
    }

    @Test void invalidEmployeeSortIsBadRequest() throws Exception {
        mvc.perform(get("/api/v1/employees?sort=notAField,asc").header("Authorization", token("admin")))
                .andExpect(status().isBadRequest());
    }

    @Test void absentDayCannotAccrueWorkedOrOvertimeHours() throws Exception {
        long employeeId = users.findByUsername("employee01").orElseThrow().getEmployee().getId();
        mvc.perform(post("/api/v1/attendance").header("Authorization", token("admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"employeeId\":" + employeeId + ",\"attendanceDate\":\"2097-05-02\",\"status\":\"ABSENT\",\"checkIn\":\"08:00\",\"checkOut\":\"18:00\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.workedHours").value(0))
                .andExpect(jsonPath("$.overtimeHours").value(0));
    }

    @Test void employeeFiltersAreAppliedBeforePagination() throws Exception {
        mvc.perform(get("/api/v1/employees?status=TERMINATED&size=1&sort=employeeCode,desc")
                .header("Authorization", token("admin")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].status").value("TERMINATED"));
    }

    @Test void searchingAndSortingCanReachEmployeesBeyondFirstPage() throws Exception {
        var template = users.findByUsername("employee01").orElseThrow().getEmployee();
        for (int i = 0; i < 25; i++) {
            String code = "REG-PAGE-" + String.format("%02d", i);
            employees.save(new vn.binhannhrm.domain.Employee(code, code, vn.binhannhrm.domain.Gender.OTHER,
                    "0900000000", code + "@example.test", java.time.LocalDate.of(2025, 1, 1), template.getDepartment(), template.getPosition()));
        }
        employees.flush();
        mvc.perform(get("/api/v1/employees?search=REG-PAGE&size=20&page=1&sort=employeeCode,asc")
                .header("Authorization", token("admin")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(25))
                .andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.content.length()").value(5))
                .andExpect(jsonPath("$.content[0].employeeCode").value("REG-PAGE-20"));
    }

    @Test void leaveFilterCountsOnlyRequestedStatus() throws Exception {
        mvc.perform(get("/api/v1/leave-requests?status=CANCELLED&size=1")
                .header("Authorization", token("admin")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test void adminWithoutEmployeeProfileCanReviewLeave() throws Exception {
        var types = mvc.perform(get("/api/v1/leave-types").header("Authorization", token("employee01")))
                .andReturn().getResponse().getContentAsString();
        long typeId = json.readTree(types).get(0).get("id").asLong();
        var created = mvc.perform(post("/api/v1/leave-requests").header("Authorization", token("employee01"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"leaveTypeId\":" + typeId
                        + ",\"fromDate\":\"2097-08-01\",\"toDate\":\"2097-08-01\",\"reason\":\"Regression\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(created).get("id").asLong();
        mvc.perform(patch("/api/v1/leave-requests/" + id + "/review").header("Authorization", token("admin"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"APPROVED\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test void attendanceCannotUseScheduleFromAnotherDay() throws Exception {
        String authorization = token("admin");
        long employeeId = users.findByUsername("employee01").orElseThrow().getEmployee().getId();
        var shifts = mvc.perform(get("/api/v1/work-shifts").header("Authorization", authorization)).andReturn().getResponse().getContentAsString();
        long shiftId = json.readTree(shifts).get(0).get("id").asLong();
        var created = mvc.perform(post("/api/v1/work-schedules").header("Authorization", authorization)
                .contentType(MediaType.APPLICATION_JSON).content("{\"employeeId\":" + employeeId + ",\"shiftId\":" + shiftId + ",\"workDate\":\"2097-05-04\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long scheduleId = json.readTree(created).get("id").asLong();
        mvc.perform(post("/api/v1/attendance").header("Authorization", authorization)
                .contentType(MediaType.APPLICATION_JSON).content("{\"employeeId\":" + employeeId + ",\"scheduleId\":" + scheduleId
                        + ",\"attendanceDate\":\"2097-05-05\",\"status\":\"PRESENT\",\"checkIn\":\"08:00\",\"checkOut\":\"17:00\"}"))
                .andExpect(status().isConflict());
    }
}
