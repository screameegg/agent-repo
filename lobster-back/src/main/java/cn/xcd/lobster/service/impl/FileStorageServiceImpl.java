package cn.xcd.lobster.service.impl;

import cn.xcd.lobster.common.exception.BusinessException;
import cn.xcd.lobster.model.vo.FileUploadVO;
import cn.xcd.lobster.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    private final Path rootPath;
    private final String publicPrefix;

    public FileStorageServiceImpl(
            @Value("${lobster.upload.root-path:uploads}") String rootPath,
            @Value("${lobster.upload.public-prefix:/uploads}") String publicPrefix) {
        this.rootPath = Path.of(rootPath).toAbsolutePath().normalize();
        this.publicPrefix = normalizePublicPrefix(publicPrefix);
    }

    @Override
    public FileUploadVO uploadImage(MultipartFile file) {
        validateImage(file);

        String originalName = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = getExtension(originalName);
        String relativePath = "images/" + LocalDate.now().format(DATE_FORMATTER) + "/"
                + UUID.randomUUID().toString().replace("-", "") + "." + extension;
        Path target = rootPath.resolve(relativePath).normalize();

        if (!target.startsWith(rootPath)) {
            throw new BusinessException(400, "文件路径不合法");
        }

        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target);
        } catch (IOException exception) {
            throw new BusinessException(500, "文件保存失败");
        }

        String normalizedPath = relativePath.replace('\\', '/');
        return new FileUploadVO(
                publicPrefix + "/" + normalizedPath,
                normalizedPath,
                originalName,
                file.getContentType(),
                file.getSize()
        );
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "图片文件不能为空");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new BusinessException(400, "图片不能超过5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new BusinessException(400, "仅支持图片文件");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(400, "仅支持jpg、png、webp、gif图片");
        }
    }

    private String getExtension(String filename) {
        String cleanFilename = StringUtils.cleanPath(filename == null ? "" : filename);
        int index = cleanFilename.lastIndexOf('.');
        if (index < 0 || index == cleanFilename.length() - 1) {
            throw new BusinessException(400, "图片文件名缺少后缀");
        }
        return cleanFilename.substring(index + 1).toLowerCase(Locale.ROOT);
    }

    private String normalizePublicPrefix(String value) {
        String prefix = StringUtils.hasText(value) ? value.trim() : "/uploads";
        if (!prefix.startsWith("/")) {
            prefix = "/" + prefix;
        }
        while (prefix.endsWith("/")) {
            prefix = prefix.substring(0, prefix.length() - 1);
        }
        return prefix;
    }
}
