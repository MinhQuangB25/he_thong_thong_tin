package vn.binhannhrm.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamIdAndActiveTrue(Long teamId);
    boolean existsByTeamIdAndEmployeeId(Long teamId, Long employeeId);

    @Query("""
            select tm.employee.id from TeamMember tm
            where tm.team.leader.id = :leaderId
              and tm.team.active = true
              and tm.active = true
            order by tm.employee.fullName
            """)
    List<Long> findActiveEmployeeIdsByLeaderId(@Param("leaderId") Long leaderId);

    @Query("""
            select count(tm) > 0 from TeamMember tm
            where tm.team.leader.id = :leaderId
              and tm.team.active = true
              and tm.active = true
              and tm.employee.id = :employeeId
            """)
    boolean existsActiveMembership(@Param("leaderId") Long leaderId, @Param("employeeId") Long employeeId);
}
