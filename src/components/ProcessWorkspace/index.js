export { default as ProcessWorkspaceShell } from './ProcessWorkspaceShell'
export { default as ProcessViewSwitcher } from './ProcessViewSwitcher'
export { default as ProcessFilterBar } from './ProcessFilterBar'
export { MODULE_STAGE_CATALOGS, getModuleCatalog, PROCESS_VIEWS } from './moduleStages'
export {
  crmEntriesToProcessItems,
  deriveCrmKanbanStages,
  crmViewToModuleId,
  resolveCrmStageChange,
} from './crmAdapter'
export { getModuleViewPref, setModuleViewPref, PROCESS_WORKSPACE_PREFS_KEY } from './prefs'
