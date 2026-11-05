package vn.binhannhrm.assistant;

public class AssistantUnavailableException extends RuntimeException {
    public AssistantUnavailableException() {
        super("Trợ lý AI chưa sẵn sàng. Hãy kiểm tra Ollama và model đã tải.");
    }
}
