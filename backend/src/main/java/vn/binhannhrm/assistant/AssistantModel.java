package vn.binhannhrm.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;

public interface AssistantModel {
    JsonNode decide(String question, List<AssistantDtos.ConversationTurn> history);
}
