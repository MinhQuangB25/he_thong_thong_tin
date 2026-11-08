package vn.binhannhrm.assistant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;

public final class AssistantDtos {
    private AssistantDtos() {}

    public record ConversationTurn(@NotBlank @Size(max = 500) String question,
                                   @NotBlank @Size(max = 600) String answer) {}
    public record Question(@NotBlank @Size(max = 500) String question,
                           @Size(max = 4) List<@NotNull @Valid ConversationTurn> history) {
        public Question { if (history == null) history = List.of(); }
    }
    public record Fact(String label, String value) {}
    public record Proposal(String action, String summary, Map<String, Object> payload) {}
    public record Result(String kind, String answer, List<Fact> facts, List<String> sources, Proposal proposal) {
        public static Result answer(String answer, List<Fact> facts, List<String> sources) {
            return new Result("ANSWER", answer, facts, sources, null);
        }
        public static Result proposal(Proposal proposal) {
            return new Result("PROPOSAL", null, List.of(), List.of(), proposal);
        }
    }
}
