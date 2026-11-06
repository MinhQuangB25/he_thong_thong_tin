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

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(print = MockMvcPrint.NONE)
@Transactional
class ContractControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired AppUserRepository users;
    @Autowired AuditLogRepository auditLogs;

    @Test
    void contractsRequireAuthenticationAndHrRole() throws Exception {
        mvc.perform(get("/api/v1/contracts")).andExpect(status().isUnauthorized());
        for (String username : new String[]{"employee01", "leader01"}) {
            mvc.perform(get("/api/v1/contracts").header("Authorization", token(username)))
                    .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("FORBIDDEN"));
            mvc.perform(post("/api/v1/contracts").header("Authorization", token(username))
                            .contentType(MediaType.APPLICATION_JSON).content(body(employeeId(), "HD-DENIED", LocalDate.now().plusMonths(1), null)))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void hrListsCreatesRenewalAndTerminatesContract() throws Exception {
        long employeeId = employeeId();
        String hr = token("hr.manager");
        mvc.perform(get("/api/v1/contracts?employeeId=" + employeeId).header("Authorization", hr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employeeId").value(employeeId))
                .andExpect(jsonPath("$[0].effectiveStatus").value("ACTIVE"));

        LocalDate start = LocalDate.now().plusMonths(1).withDayOfMonth(1);
        String response = mvc.perform(post("/api/v1/contracts").header("Authorization", hr)
                        .contentType(MediaType.APPLICATION_JSON).content(body(employeeId, "HD-TEST-RENEW", start, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.effectiveStatus").value("UPCOMING"))
                .andExpect(jsonPath("$.baseSalary").value(15500000))
                .andReturn().getResponse().getContentAsString();
        long newId = json.readTree(response).get("id").asLong();

        mvc.perform(get("/api/v1/contracts?employeeId=" + employeeId).header("Authorization", hr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].contractNumber").value("HD-TEST-RENEW"))
                .andExpect(jsonPath("$[1].endDate").value(start.minusDays(1).toString()));
        assertTrue(auditLogs.findAll().stream().anyMatch(log -> "CONTRACT_CREATED".equals(log.getAction())
                && "hr.manager".equals(log.getActorUsername()) && log.getDetail().contains("15.500.000")));

        mvc.perform(patch("/api/v1/contracts/" + newId + "/terminate").header("Authorization", hr)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"endDate\":\"" + start.plusDays(10) + "\"}"))
                .andExpect(status().isConflict());

        long previousId = json.readTree(mvc.perform(get("/api/v1/contracts?employeeId=" + employeeId).header("Authorization", hr))
                .andReturn().getResponse().getContentAsString()).get(1).get("id").asLong();
        mvc.perform(patch("/api/v1/contracts/" + previousId + "/terminate").header("Authorization", hr)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"endDate\":\"" + LocalDate.now() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("TERMINATED"))
                .andExpect(jsonPath("$.endDate").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$.effectiveStatus").value("TERMINATED"));
    }

    @Test
    void invalidContractsReturnValidationOrConflict() throws Exception {
        String hr = token("hr.manager");
        LocalDate start = LocalDate.now().plusMonths(1);
        mvc.perform(post("/api/v1/contracts").header("Authorization", hr)
                        .contentType(MediaType.APPLICATION_JSON).content(body(employeeId(), "HD-BAD-RANGE", start, start.minusDays(1))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mvc.perform(post("/api/v1/contracts").header("Authorization", hr)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"employeeId\":" + employeeId() + ",\"contractNumber\":\"HD-NEG\",\"contractType\":\"Loại\",\"startDate\":\"" + start + "\",\"baseSalary\":-1,\"allowance\":0}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
        mvc.perform(post("/api/v1/contracts").header("Authorization", hr)
                        .contentType(MediaType.APPLICATION_JSON).content(body(employeeId(), "HD-BA-003", start, null)))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CONFLICT"));
        mvc.perform(patch("/api/v1/contracts/999999/terminate").header("Authorization", hr)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"endDate\":\"" + start + "\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void terminatingEmployeeEndsTheirContractAndCannotBeRepeated() throws Exception {
        long employeeId = employeeId();
        String hr = token("hr.manager");
        mvc.perform(delete("/api/v1/employees/" + employeeId).header("Authorization", hr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("TERMINATED"));
        mvc.perform(get("/api/v1/contracts?employeeId=" + employeeId).header("Authorization", hr))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("TERMINATED"))
                .andExpect(jsonPath("$[0].endDate").value(LocalDate.now().toString()))
                .andExpect(jsonPath("$[0].effectiveStatus").value("TERMINATED"));
        assertTrue(auditLogs.findAll().stream().anyMatch(log -> "CONTRACT_TERMINATED".equals(log.getAction())
                && log.getDetail().contains("do cho nghỉ việc")));
        mvc.perform(delete("/api/v1/employees/" + employeeId).header("Authorization", hr))
                .andExpect(status().isConflict());
    }

    private long employeeId() {
        return users.findByUsername("employee01").orElseThrow().getEmployee().getId();
    }

    private String body(long employeeId, String number, LocalDate start, LocalDate end) throws Exception {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("employeeId", employeeId);
        values.put("contractNumber", number);
        values.put("contractType", "Không xác định thời hạn");
        values.put("startDate", start.toString());
        values.put("endDate", end == null ? null : end.toString());
        values.put("baseSalary", 15500000);
        values.put("allowance", 600000);
        return json.writeValueAsString(values);
    }

    private String token(String username) throws Exception {
        var result = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new AuthDtos.LoginRequest(username, "password"))))
                .andExpect(status().isOk()).andReturn();
        return "Bearer " + json.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
