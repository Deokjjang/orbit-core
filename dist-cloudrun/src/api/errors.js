export function toHttpStatus(code) {
    switch (code) {
        case "BAD_REQUEST":
            return 400;
        case "IDEMPOTENCY_CONFLICT":
            return 409;
        case "VALIDATION_ERROR":
        case "ITEM_NOT_SUPPORTED":
            // 스펙에 404 없음 → "404-like"는 422로 처리
            return 422;
        case "RATE_LIMITED":
            return 429;
        case "INTERNAL":
        default:
            return 503;
    }
}
export function err(code, message, details) {
    return { code, message, details };
}
