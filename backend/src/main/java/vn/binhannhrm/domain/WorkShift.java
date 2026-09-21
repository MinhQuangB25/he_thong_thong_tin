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
import java.time.LocalTime;

@Entity
@Table(name = "work_shifts")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WorkShift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal overtimeRate = BigDecimal.valueOf(1.5);

    @Column(nullable = false)
    private boolean active = true;

    public WorkShift(String name, LocalTime startTime, LocalTime endTime, BigDecimal overtimeRate) {
        this.name = name;
        this.startTime = startTime;
        this.endTime = endTime;
        this.overtimeRate = overtimeRate;
    }
}

