package vn.binhannhrm.auth;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DemoSeedPasswordTest {
    private static final Pattern BCRYPT_HASH = Pattern.compile("'(\\$2[aby]\\$\\d{2}\\$[^']+)'", Pattern.MULTILINE);

    @Test
    void everySqlSeedDemoAccountAcceptsDocumentedPassword() throws IOException {
        String sql = Files.readString(seedFile());
        int usersStart = sql.indexOf("INSERT IGNORE INTO users");
        int rolesStart = sql.indexOf("INSERT IGNORE INTO user_roles", usersStart);
        String usersInsert = sql.substring(usersStart, rolesStart);

        Matcher matcher = BCRYPT_HASH.matcher(usersInsert);
        List<String> hashes = new ArrayList<>();
        while (matcher.find()) hashes.add(matcher.group(1));

        var encoder = new BCryptPasswordEncoder(12);
        assertEquals(4, hashes.size());
        assertTrue(hashes.stream().allMatch(hash -> encoder.matches("password", hash)));
    }

    @Test
    void sqlSeedDeclaresUtf8mb4BeforeVietnameseData() throws IOException {
        String sql = Files.readString(seedFile());

        assertTrue(sql.startsWith("SET NAMES utf8mb4;"));
        assertTrue(sql.contains("'Lê Thu Hà'"));
        assertTrue(sql.contains("'Vận hành'"));
    }

    private Path seedFile() {
        Path rootRelative = Path.of("database", "init", "02-seed.sql");
        return Files.exists(rootRelative)
                ? rootRelative
                : Path.of("..", "database", "init", "02-seed.sql");
    }
}
