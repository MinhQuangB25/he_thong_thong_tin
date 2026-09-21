package vn.binhannhrm.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PositionRepository extends JpaRepository<Position, Long> {
    boolean existsByTitleIgnoreCase(String title);
    java.util.Optional<Position> findByTitleIgnoreCase(String title);
}
