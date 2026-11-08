package vn.binhannhrm.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.util.Map;

public final class PageableValidation {
    private PageableValidation() {}
    public static Pageable validate(Pageable pageable, Map<String, String> fields) {
        var orders = pageable.getSort().stream().map(order -> {
            String field = fields.get(order.getProperty());
            if (field == null) throw new BadRequestException("Trường sắp xếp không hợp lệ");
            return new Sort.Order(order.getDirection(), field);
        }).toList();
        Sort sort = orders.isEmpty() ? Sort.by("id") : Sort.by(orders).and(Sort.by("id"));
        return PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 200), sort);
    }
}
