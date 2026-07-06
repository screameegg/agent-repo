package cn.xcd.lobster.service.impl;

import cn.xcd.lobster.mapper.SkillFileMapper;
import cn.xcd.lobster.mapper.SkillPackageMapper;
import cn.xcd.lobster.mapper.SkillPublishApplyLogMapper;
import cn.xcd.lobster.mapper.UserMapper;
import cn.xcd.lobster.mapper.UserSkillInstallMapper;
import cn.xcd.lobster.model.dto.SkillFileRequest;
import cn.xcd.lobster.model.dto.SkillSaveRequest;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.model.entity.SkillFile;
import cn.xcd.lobster.model.entity.SkillPackage;
import cn.xcd.lobster.model.vo.SkillFileVO;
import cn.xcd.lobster.model.vo.SkillPackageVO;
import cn.xcd.lobster.service.NotificationService;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.github.houbb.sensitive.word.bs.SensitiveWordBs;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SkillServiceImplTest {
    @Test
    void tokenSkillListReturnsFileCountWithoutLoadingFileTree() {
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        SkillPublishApplyLogMapper skillPublishApplyLogMapper = mock(SkillPublishApplyLogMapper.class);
        UserSkillInstallMapper userSkillInstallMapper = mock(UserSkillInstallMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        SensitiveWordBs sensitiveWordBs = mock(SensitiveWordBs.class);
        NotificationService notificationService = mock(NotificationService.class);

        SkillPackage skill = new SkillPackage();
        skill.setId(10L);
        skill.setOwnerId(1L);
        skill.setName("Repository Reader");
        skill.setCode("repository-reader");
        skill.setDescription("Read repository files");
        skill.setIcon("BookOpen");
        skill.setVersion("1.0.0");
        skill.setVisibility("private");
        skill.setPublishStatus("draft");
        skill.setAuditStatus("none");
        skill.setInstallCount(0);
        skill.setExtJson("{}");

        when(skillPackageMapper.selectList(any(Wrapper.class))).thenReturn(List.of(skill));
        when(skillFileMapper.selectCount(any(Wrapper.class))).thenReturn(3L);

        SkillServiceImpl service = new SkillServiceImpl(
                skillPackageMapper,
                skillFileMapper,
                skillPublishApplyLogMapper,
                userSkillInstallMapper,
                userMapper,
                sensitiveWordBs,
                notificationService
        );
        AgentToken token = new AgentToken();
        token.setOwnerId(1L);

        List<SkillPackageVO> skills = service.mineByToken(token);

        assertEquals(3, skills.get(0).getFileCount());
        assertEquals(List.of(), skills.get(0).getFiles());
        verify(skillFileMapper, never()).selectList(any(Wrapper.class));
    }

    @Test
    void updatePublishedSkillWithSensitiveContentMovesBackToAudit() {
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        SkillPublishApplyLogMapper skillPublishApplyLogMapper = mock(SkillPublishApplyLogMapper.class);
        UserSkillInstallMapper userSkillInstallMapper = mock(UserSkillInstallMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        SensitiveWordBs sensitiveWordBs = mock(SensitiveWordBs.class);
        NotificationService notificationService = mock(NotificationService.class);

        SkillPackage skill = new SkillPackage();
        skill.setId(10L);
        skill.setOwnerId(1L);
        skill.setName("Published Skill");
        skill.setCode("published-skill");
        skill.setDescription("before");
        skill.setIcon("Sparkles");
        skill.setVersion("1.0.0");
        skill.setVisibility("public");
        skill.setPublishStatus("published");
        skill.setAuditStatus("approved");
        skill.setAuditReason("");
        skill.setAuditTime(LocalDateTime.now());
        skill.setInstallCount(0);
        skill.setExtJson("{}");

        List<SkillFile> storedFiles = new ArrayList<>();
        when(skillPackageMapper.selectOne(any(Wrapper.class))).thenReturn(skill);
        when(skillPackageMapper.selectById(10L)).thenReturn(skill);
        when(skillFileMapper.selectList(any(Wrapper.class))).thenReturn(storedFiles);
        when(sensitiveWordBs.contains(any(String.class))).thenReturn(true);
        when(sensitiveWordBs.findAll(any(String.class))).thenReturn(List.of("blocked"));
        doAnswer(invocation -> {
            storedFiles.clear();
            return 1;
        }).when(skillFileMapper).delete(any(Wrapper.class));
        doAnswer(invocation -> {
            SkillFile file = invocation.getArgument(0);
            file.setId((long) storedFiles.size() + 1);
            storedFiles.add(file);
            return 1;
        }).when(skillFileMapper).insert(any(SkillFile.class));

        SkillServiceImpl service = new SkillServiceImpl(
                skillPackageMapper,
                skillFileMapper,
                skillPublishApplyLogMapper,
                userSkillInstallMapper,
                userMapper,
                sensitiveWordBs,
                notificationService
        );

        SkillSaveRequest request = new SkillSaveRequest();
        request.setName("Published Skill");
        request.setDescription("after");
        request.setVisibility("public");
        request.setPublishStatus("published");
        SkillFileRequest file = new SkillFileRequest();
        file.setName("SKILL.md");
        file.setPath("SKILL.md");
        file.setLanguage("markdown");
        file.setContent("contains blocked content");
        request.setFiles(List.of(file));
        AgentToken token = new AgentToken();
        token.setOwnerId(1L);

        SkillPackageVO result = service.updateByToken(token, 10L, request);

        assertEquals("private", result.getVisibility());
        assertEquals("pending", result.getPublishStatus());
        assertEquals("pending", result.getAuditStatus());
        assertTrue(result.getAuditReason().contains("blocked"));
        verify(skillPackageMapper).updateById(skill);
        verify(notificationService).createForUser(
                any(Long.class),
                any(),
                any(String.class),
                any(String.class),
                any(String.class),
                any(String.class),
                any(Long.class)
        );
    }

    @Test
    void tokenSkillDetailAcceptsCodeAndReturnsPersistedFiles() {
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        SkillPublishApplyLogMapper skillPublishApplyLogMapper = mock(SkillPublishApplyLogMapper.class);
        UserSkillInstallMapper userSkillInstallMapper = mock(UserSkillInstallMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        SensitiveWordBs sensitiveWordBs = mock(SensitiveWordBs.class);
        NotificationService notificationService = mock(NotificationService.class);

        SkillPackage skill = new SkillPackage();
        skill.setId(10L);
        skill.setOwnerId(1L);
        skill.setName("Repository Reader");
        skill.setCode("repository-reader");
        skill.setDescription("Read repository files");
        skill.setIcon("BookOpen");
        skill.setVersion("1.0.0");
        skill.setVisibility("private");
        skill.setPublishStatus("draft");
        skill.setAuditStatus("none");
        skill.setInstallCount(0);
        skill.setExtJson("{}");
        SkillFile file = new SkillFile();
        file.setId(20L);
        file.setSkillId(10L);
        file.setNodeType("file");
        file.setName("SKILL.md");
        file.setPath("SKILL.md");
        file.setLanguage("markdown");
        file.setContent("# Repository Reader");
        file.setSortOrder(0);

        when(skillPackageMapper.selectOne(any(Wrapper.class))).thenReturn(skill);
        when(skillFileMapper.selectList(any(Wrapper.class))).thenReturn(List.of(file));

        SkillServiceImpl service = new SkillServiceImpl(
                skillPackageMapper,
                skillFileMapper,
                skillPublishApplyLogMapper,
                userSkillInstallMapper,
                userMapper,
                sensitiveWordBs,
                notificationService
        );
        AgentToken token = new AgentToken();
        token.setOwnerId(1L);

        SkillPackageVO result = service.detailByToken(token, "repository-reader");

        assertEquals("repository-reader", result.getCode());
        assertEquals(1, result.getFiles().size());
        SkillFileVO resultFile = result.getFiles().get(0);
        assertEquals("SKILL.md", resultFile.getPath());
        assertEquals("# Repository Reader", resultFile.getContent());
    }

    @Test
    void createByTokenPersistsAndReturnsSubmittedFiles() {
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        SkillPublishApplyLogMapper skillPublishApplyLogMapper = mock(SkillPublishApplyLogMapper.class);
        UserSkillInstallMapper userSkillInstallMapper = mock(UserSkillInstallMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        SensitiveWordBs sensitiveWordBs = mock(SensitiveWordBs.class);
        NotificationService notificationService = mock(NotificationService.class);
        List<SkillFile> storedFiles = new ArrayList<>();

        when(skillPackageMapper.selectOne(any(Wrapper.class))).thenReturn(null);
        when(skillPackageMapper.selectCount(any(Wrapper.class))).thenReturn(0L);
        doAnswer(invocation -> {
            SkillPackage skill = invocation.getArgument(0);
            skill.setId(10L);
            return 1;
        }).when(skillPackageMapper).insert(any(SkillPackage.class));
        doAnswer(invocation -> {
            SkillFile file = invocation.getArgument(0);
            file.setId((long) storedFiles.size() + 1);
            storedFiles.add(file);
            return 1;
        }).when(skillFileMapper).insert(any(SkillFile.class));
        when(skillFileMapper.selectList(any(Wrapper.class))).thenReturn(storedFiles);

        SkillServiceImpl service = new SkillServiceImpl(
                skillPackageMapper,
                skillFileMapper,
                skillPublishApplyLogMapper,
                userSkillInstallMapper,
                userMapper,
                sensitiveWordBs,
                notificationService
        );
        SkillFileRequest file = new SkillFileRequest();
        file.setNodeType("file");
        file.setName("SKILL.md");
        file.setPath("SKILL.md");
        file.setLanguage("markdown");
        file.setContent("# Skill");
        SkillSaveRequest request = new SkillSaveRequest();
        request.setName("Repository Reader");
        request.setCode("repository-reader");
        request.setFiles(List.of(file));
        AgentToken token = new AgentToken();
        token.setOwnerId(1L);

        SkillPackageVO result = service.createByToken(token, request);

        assertEquals(1, storedFiles.size());
        assertEquals("# Skill", storedFiles.get(0).getContent());
        assertEquals(1, result.getFiles().size());
        assertEquals("# Skill", result.getFiles().get(0).getContent());
    }

    @Test
    void detailBackfillsDefaultSkillFileForLegacyEmptyPackage() {
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        SkillPublishApplyLogMapper skillPublishApplyLogMapper = mock(SkillPublishApplyLogMapper.class);
        UserSkillInstallMapper userSkillInstallMapper = mock(UserSkillInstallMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        SensitiveWordBs sensitiveWordBs = mock(SensitiveWordBs.class);
        NotificationService notificationService = mock(NotificationService.class);
        List<SkillFile> storedFiles = new ArrayList<>();

        SkillPackage skill = new SkillPackage();
        skill.setId(10L);
        skill.setOwnerId(1L);
        skill.setName("Legacy Empty Skill");
        skill.setCode("legacy-empty-skill");
        skill.setDescription("No files yet");
        skill.setIcon("Sparkles");
        skill.setVersion("1.0.0");
        skill.setVisibility("private");
        skill.setPublishStatus("draft");
        skill.setAuditStatus("none");
        skill.setInstallCount(0);
        skill.setExtJson("{}");

        when(skillPackageMapper.selectOne(any(Wrapper.class))).thenReturn(skill);
        when(skillPackageMapper.selectById(10L)).thenReturn(skill);
        when(skillFileMapper.selectList(any(Wrapper.class))).thenReturn(storedFiles);
        doAnswer(invocation -> {
            SkillFile file = invocation.getArgument(0);
            file.setId(20L);
            storedFiles.add(file);
            return 1;
        }).when(skillFileMapper).insert(any(SkillFile.class));

        SkillServiceImpl service = new SkillServiceImpl(
                skillPackageMapper,
                skillFileMapper,
                skillPublishApplyLogMapper,
                userSkillInstallMapper,
                userMapper,
                sensitiveWordBs,
                notificationService
        );
        AgentToken token = new AgentToken();
        token.setOwnerId(1L);

        SkillPackageVO result = service.detailByToken(token, "legacy-empty-skill");

        assertEquals(1, result.getFileCount());
        assertEquals("SKILL.md", result.getFiles().get(0).getPath());
        assertTrue(result.getFiles().get(0).getContent().contains("Legacy Empty Skill"));
        verify(skillFileMapper).insert(any(SkillFile.class));
    }

    @Test
    void tokenSkillListBackfillsFileCountForLegacyEmptyPackage() {
        SkillPackageMapper skillPackageMapper = mock(SkillPackageMapper.class);
        SkillFileMapper skillFileMapper = mock(SkillFileMapper.class);
        SkillPublishApplyLogMapper skillPublishApplyLogMapper = mock(SkillPublishApplyLogMapper.class);
        UserSkillInstallMapper userSkillInstallMapper = mock(UserSkillInstallMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        SensitiveWordBs sensitiveWordBs = mock(SensitiveWordBs.class);
        NotificationService notificationService = mock(NotificationService.class);

        SkillPackage skill = new SkillPackage();
        skill.setId(10L);
        skill.setOwnerId(1L);
        skill.setName("Legacy Empty Skill");
        skill.setCode("legacy-empty-skill");
        skill.setDescription("No files yet");
        skill.setIcon("Sparkles");
        skill.setVersion("1.0.0");
        skill.setVisibility("private");
        skill.setPublishStatus("draft");
        skill.setAuditStatus("none");
        skill.setInstallCount(0);
        skill.setExtJson("{}");

        when(skillPackageMapper.selectList(any(Wrapper.class))).thenReturn(List.of(skill));
        when(skillPackageMapper.selectById(10L)).thenReturn(skill);
        when(skillFileMapper.selectCount(any(Wrapper.class))).thenReturn(0L);

        SkillServiceImpl service = new SkillServiceImpl(
                skillPackageMapper,
                skillFileMapper,
                skillPublishApplyLogMapper,
                userSkillInstallMapper,
                userMapper,
                sensitiveWordBs,
                notificationService
        );
        AgentToken token = new AgentToken();
        token.setOwnerId(1L);

        List<SkillPackageVO> result = service.mineByToken(token);

        assertEquals(1, result.get(0).getFileCount());
        assertEquals(List.of(), result.get(0).getFiles());
        verify(skillFileMapper).insert(any(SkillFile.class));
    }
}
