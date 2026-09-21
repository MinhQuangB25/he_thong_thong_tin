package vn.binhannhrm.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamIdAndActiveTrue(Long teamId);
    boolean existsByTeamIdAndEmployeeId(Long teamId, Long employeeId);
}

