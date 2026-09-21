package vn.binhannhrm.common;

public record ApiError(
        int status,
        String code,
        String message,
        Object details
) {
}

