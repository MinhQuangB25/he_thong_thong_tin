package vn.binhannhrm.people;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrint;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.auth.AppUserRepository;
import vn.binhannhrm.auth.AuthDtos;
import vn.binhannhrm.domain.AuditLogRepository;
import vn.binhannhrm.domain.Employee;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(print = MockMvcPrint.NONE)
@Transactional
class EmployeeUpdateControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired AppUserRepository users;
    @Autowired AuditLogRepository auditLogs;

    @Test
    void updateRequiresAuthentication() throws Exception {
        Employee target = employee("employee01");
        mvc.perform(put("/api/v1/employees/" + target.getId()).contentType(MediaType.APPLICATION_JSON).content(body(target, Map.of())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void employeeAndTeamLeaderCannotUpdateEmployees() throws Exception {
        Employee target = employee("employee01");
        for (String username : new String[]{"employee01", "leader01"}) {
            mvc.perform(put("/api/v1/employees/" + target.getId()).header("Authorization", token(username))
                            .contentType(MediaType.APPLICATION_JSON).content(body(target, Map.of("fullName", "Tên bị sửa"))))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        }
    }

    @Test
    void hrManagerUpdatesEmployeeAndAuditIsWritten() throws Exception {
        Employee target = employee("employee01");
        long before = auditLogs.count();

        mvc.perform(put("/api/v1/employees/" + target.getId()).header("Authorization", token("hr.manager"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(target, Map.of("fullName", "Nguyễn Minh Anh (đã sửa)", "educationLevel", "Thạc sĩ"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Nguyễn Minh Anh (đã sửa)"))
                .andExpect(jsonPath("$.educationLevel").value("Thạc sĩ"))
                .andExpect(jsonPath("$.employeeCode").value(target.getEmployeeCode()))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        assertTrue(auditLogs.count() > before);
        assertTrue(auditLogs.findAll().stream().anyMatch(log -> "EMPLOYEE_UPDATED".equals(log.getAction())
                && "hr.manager".equals(log.getActorUsername()) && target.getId().equals(log.getEntityId())));
    }

    @Test
    void invalidUpdateReturnsValidationError() throws Exception {
        Employee target = employee("employee01");
        mvc.perform(put("/api/v1/employees/" + target.getId()).header("Authorization", token("hr.manager"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body(target, Map.of("fullName", " ", "email", "không-phải-email"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void duplicateEmailReturnsConflictAndUnknownEmployeeReturnsNotFound() throws Exception {
        Employee target = employee("employee01");
        Employee other = employee("leader01");
        mvc.perform(put("/api/v1/employees/" + target.getId()).header("Authorization", token("hr.manager"))
                        .contentType(MediaType.APPLICATION_JSON).content(body(target, Map.of("email", other.getEmail()))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
        mvc.perform(put("/api/v1/employees/999999").header("Authorization", token("hr.manager"))
                        .contentType(MediaType.APPLICATION_JSON).content(body(target, Map.of())))
                .andExpect(status().isNotFound());
    }

    private Employee employee(String username) {
        return users.findByUsername(username).orElseThrow().getEmployee();
    }

    private String body(Employee employee, Map<String, Object> overrides) throws Exception {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("fullName", employee.getFullName());
        values.put("gender", employee.getGender().name());
        values.put("nationalId", employee.getNationalId());
        values.put("phone", employee.getPhone());
        values.put("email", employee.getEmail());
        values.put("address", employee.getAddress());
        values.put("educationLevel", employee.getEducationLevel());
        values.put("joinDate", employee.getJoinDate().toString());
        values.put("departmentId", employee.getDepartment().getId());
        values.put("positionId", employee.getPosition().getId());
        values.putAll(overrides);
        return json.writeValueAsString(values);
    }

    private String token(String username) throws Exception {
        var result = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new AuthDtos.LoginRequest(username, "password"))))
                .andExpect(status().isOk()).andReturn();
        return "Bearer " + json.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
