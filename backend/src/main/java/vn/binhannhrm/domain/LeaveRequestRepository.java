package vn.binhannhrm.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<LeaveRequest> {
    Page<LeaveRequest> findByEmployeeId(Long employeeId, Pageable pageable);

    @Query("""
            select count(r) > 0 from LeaveRequest r
            where r.employee.id = :employeeId
              and r.status in (vn.binhannhrm.domain.LeaveStatus.PENDING, vn.binhannhrm.domain.LeaveStatus.APPROVED)
              and r.fromDate <= :toDate and r.toDate >= :fromDate
            """)
    boolean existsOverlapping(@Param("employeeId") Long employeeId,
                              @Param("fromDate") LocalDate fromDate,
                              @Param("toDate") LocalDate toDate);
}
