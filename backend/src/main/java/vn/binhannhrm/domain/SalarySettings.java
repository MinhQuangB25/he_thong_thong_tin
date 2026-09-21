package vn.binhannhrm.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "salary_settings")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SalarySettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int standardWorkDays;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal overtimeMultiplier;

    @Column(nullable = false)
    private LocalDate effectiveFrom;

    public SalarySettings(int standardWorkDays, BigDecimal overtimeMultiplier, LocalDate effectiveFrom) {
        this.standardWorkDays = standardWorkDays;
        this.overtimeMultiplier = overtimeMultiplier;
        this.effectiveFrom = effectiveFrom;
    }
}

