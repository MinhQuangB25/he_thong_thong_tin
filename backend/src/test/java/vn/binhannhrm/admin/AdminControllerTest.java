package vn.binhannhrm.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void adminCanCreateAccountWithRole() throws Exception {
        String token = login("admin", "password");
        String body = """
                {
                  "username": "admin.test",
                  "password": "password",
                  "displayName": "Tài khoản kiểm thử",
                  "roles": ["EMPLOYEE"],
                  "status": "ACTIVE"
                }
                """;

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("admin.test"))
                .andExpect(jsonPath("$.roles[0]").value("EMPLOYEE"));
    }

    @Test
    void adminCanChangeRolesAndDeleteAccount() throws Exception {
        String token = login("admin", "password");
        String createBody = """
                {
                  "username": "admin.lifecycle",
                  "password": "password",
                  "displayName": "Tài khoản vòng đời",
                  "roles": ["EMPLOYEE"],
                  "status": "ACTIVE"
                }
                """;

        String created = mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(created).get("id").asLong();

        mockMvc.perform(put("/api/v1/users/{id}/roles", id)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roles\":[\"HR_MANAGER\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles[0]").value("HR_MANAGER"));

        mockMvc.perform(delete("/api/v1/users/{id}", id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void employeeCannotCreateAccount() throws Exception {
        String token = login("employee01", "password");
        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"forbidden\",\"password\":\"password\",\"displayName\":\"Forbidden\",\"roles\":[\"EMPLOYEE\"],\"status\":\"ACTIVE\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    private String login(String username, String password) throws Exception {
        String body = objectMapper.writeValueAsString(new LoginBody(username, password));
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(response);
        return json.get("accessToken").asText();
    }

    private record LoginBody(String username, String password) {
    }
}
