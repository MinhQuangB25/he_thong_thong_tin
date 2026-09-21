package vn.binhannhrm.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SalarySettingsRepository extends JpaRepository<SalarySettings, Long> {
    Optional<SalarySettings> findTopByOrderByEffectiveFromDesc();
}

