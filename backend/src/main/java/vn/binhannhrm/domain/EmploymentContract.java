package vn.binhannhrm.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "employment_contracts")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmploymentContract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false, unique = true, length = 50)
    private String contractNumber;

    @Column(nullable = false, length = 80)
    private String contractType;

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal baseSalary;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal allowance = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContractStatus status = ContractStatus.ACTIVE;

    public EmploymentContract(
            Employee employee,
            String contractNumber,
            String contractType,
            LocalDate startDate,
            BigDecimal baseSalary,
            BigDecimal allowance
    ) {
        this.employee = employee;
        this.contractNumber = contractNumber;
        this.contractType = contractType;
        this.startDate = startDate;
        this.baseSalary = baseSalary;
        this.allowance = allowance;
    }
}

