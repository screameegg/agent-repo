package cn.xcd.lobster.service;

import cn.xcd.lobster.common.result.PageResult;
import cn.xcd.lobster.model.entity.AgentToken;
import cn.xcd.lobster.model.dto.SkillSaveRequest;
import cn.xcd.lobster.model.vo.SkillPackageVO;

import java.util.List;

public interface SkillService {

    PageResult<SkillPackageVO> market(Long current, Long size, String keyword);

    PageResult<SkillPackageVO> mine(Long current, Long size);

    PageResult<SkillPackageVO> installed(Long current, Long size);

    SkillPackageVO detail(Long id);

    SkillPackageVO create(SkillSaveRequest request);

    SkillPackageVO createByToken(AgentToken token, SkillSaveRequest request);

    SkillPackageVO update(Long id, SkillSaveRequest request);

    SkillPackageVO updateByToken(AgentToken token, Long id, SkillSaveRequest request);

    List<SkillPackageVO> mineByToken(AgentToken token);

    SkillPackageVO detailByToken(AgentToken token, String idOrCode);

    SkillPackageVO publish(Long id);

    SkillPackageVO offline(Long id);

    SkillPackageVO install(Long id);

    SkillPackageVO fork(Long id);

    void delete(Long id);

    void uninstall(Long id);
}
