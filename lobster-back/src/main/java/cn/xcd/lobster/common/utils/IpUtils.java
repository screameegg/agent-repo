package cn.xcd.lobster.common.utils;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;

public final class IpUtils {

    private static final String UNKNOWN = "unknown";
    private static final String[] IP_HEADERS = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP"
    };

    private IpUtils() {
    }

    public static String getClientIpAddress(HttpServletRequest request) {
        for (String header : IP_HEADERS) {
            String ip = request.getHeader(header);
            if (StringUtils.hasText(ip) && !UNKNOWN.equalsIgnoreCase(ip)) {
                return firstIp(ip);
            }
        }
        return request.getRemoteAddr();
    }

    private static String firstIp(String ip) {
        int index = ip.indexOf(',');
        return index < 0 ? ip.trim() : ip.substring(0, index).trim();
    }
}
