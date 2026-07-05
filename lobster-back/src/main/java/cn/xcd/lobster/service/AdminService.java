package cn.xcd.lobster.service;

import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.model.vo.AdminUserVO;
import cn.xcd.lobster.model.vo.SkillPackageVO;

public interface AdminService {

    PageResult<AdminUserVO> pageUsers(Long current, Long size, String keyword);

    AdminUserVO updateUserRole(Long id, String role);

    AdminUserVO updateUserStatus(Long id, String status);

    PageResult<SkillPackageVO> pageSkills(Long current, Long size, String keyword, String auditStatus, String publishStatus);

    SkillPackageVO approveSkill(Long id);

    SkillPackageVO rejectSkill(Long id, String reason);

    SkillPackageVO publishSkill(Long id);

    SkillPackageVO offlineSkill(Long id);
}
