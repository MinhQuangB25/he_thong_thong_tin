package vn.binhannhrm.audit;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.domain.AuditLog;
import vn.binhannhrm.domain.AuditLogRepository;

@Service
public class AuditLogService {
    private final AuditLogRepository repository;
    public AuditLogService(AuditLogRepository repository) { this.repository = repository; }
    @Transactional
    public void record(String action, String entityName, Long entityId, String detail) {
        String actor = SecurityContextHolder.getContext().getAuthentication() == null ? "system" : SecurityContextHolder.getContext().getAuthentication().getName();
        repository.save(new AuditLog(actor, action, entityName, entityId, detail));
    }
}
