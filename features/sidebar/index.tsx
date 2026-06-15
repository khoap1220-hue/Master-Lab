
import React, { useState } from 'react';
import { Scenario, ScenarioCategory, Workflow, BrandIdentity } from '../../types';
import ProjectDashboard from '../project-control/ProjectDashboard';
import SidebarHeader from './SidebarHeader';
import CategorySelector from './CategorySelector';
import AutomationForm from './AutomationForm';

interface SidebarProps {
  categories: {id: ScenarioCategory, icon: string}[];
  activeCategory: ScenarioCategory;
  onCategoryChange: (cat: ScenarioCategory) => void;
  scenarios: Scenario[];
  onScenarioSelect: (prompt: string, isWorkflow?: boolean) => void;
  onAutomationStart?: (
    goal: string, 
    batchSize: number, 
    category: ScenarioCategory, 
    logoAsset: string | null,
    moodboardAssets?: string[],
    brandUrl?: string,
    brandInfo?: { color: string; vibe: string }
  ) => void;
  activeWorkflows?: Workflow[];
  isOpen: boolean;
  onClose: () => void;
  creativeDrift: number;
  onDriftChange: (val: number) => void;
  onOpenBatchStudio: () => void;
  onOpenBrandStudio: () => void;
  brandIdentity: BrandIdentity | null;
  brands?: BrandIdentity[];
  onSetActiveBrand?: (id: string | null) => void;
  onUpdateBrands?: (brands: BrandIdentity[]) => void;
}

export default function Sidebar({ 
  categories = [], 
  activeCategory, 
  onCategoryChange, 
  scenarios = [], 
  onAutomationStart,
  activeWorkflows = [],
  isOpen,
  onClose,
  creativeDrift,
  onDriftChange,
  onOpenBatchStudio,
  onOpenBrandStudio,
  brandIdentity,
  brands = [],
  onSetActiveBrand,
  onUpdateBrands
}: SidebarProps) {
  const [view, setView] = useState<'automation' | 'projects'>('automation');

  const handleAutomationStart = (
    goal: string, 
    batchSize: number, 
    category: ScenarioCategory, 
    logoAsset: string | null,
    moodboardAssets?: string[],
    brandUrl?: string,
    brandInfo?: { color: string; vibe: string }
  ) => {
    if (onAutomationStart) {
      onAutomationStart(goal, batchSize, category, logoAsset, moodboardAssets, brandUrl, brandInfo);
      setView('projects'); // Auto switch to projects view
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] xl:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 w-[85%] sm:w-[400px] xl:static xl:w-[400px] xl:h-full
          border-r border-zinc-800 bg-[#0a0f1d] flex flex-col 
          transition-transform duration-500 ease-in-out z-[50] shadow-[10px_0_30px_rgba(0,0,0,0.5)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
        `}
        aria-label="Main Sidebar"
        role="complementary"
      >
        <SidebarHeader 
          onClose={onClose}
          onOpenBatchStudio={onOpenBatchStudio}
          onOpenBrandStudio={onOpenBrandStudio}
          view={view}
          setView={setView}
          activeWorkflowsCount={(activeWorkflows || []).length}
          brandIdentity={brandIdentity}
        />

        {view === 'automation' ? (
          <div className="flex flex-1 overflow-hidden flex-col min-h-0">
            <CategorySelector 
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
            />

            <AutomationForm 
              activeCategory={activeCategory}
              onAutomationStart={handleAutomationStart}
              creativeDrift={creativeDrift}
              onDriftChange={onDriftChange}
              brandIdentity={brandIdentity}
              brands={brands}
              onSetActiveBrand={onSetActiveBrand}
              onUpdateBrands={onUpdateBrands}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-zinc-950/20 min-h-0">
             <ProjectDashboard workflows={activeWorkflows} />
          </div>
        )}
      </aside>
    </>
  );
}
