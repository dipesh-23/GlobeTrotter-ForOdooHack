import React from 'react';

export default function BudgetSummaryRow({ totalCost, tripLength, budgetTarget, onSetBudget }) {
  const avgCostPerDay = tripLength > 0 ? Math.round(totalCost / tripLength) : totalCost;
  const isOverBudget = budgetTarget && totalCost > budgetTarget;
  const pctUsed = budgetTarget ? Math.min(100, Math.round((totalCost / budgetTarget) * 100)) : 0;

  return (
    <div className="bg-bg border-b border-border py-[24px]">
      <div className="max-w-[1000px] mx-auto w-full px-[24px] flex flex-col md:flex-row items-start md:items-center justify-between gap-[24px]">
        
        {/* Total Cost */}
        <div className="flex flex-col">
          <span className="text-[12px] font-medium uppercase tracking-wider text-muted font-['IBM_Plex_Mono'] mb-[4px]">
            Trip Grand Total
          </span>
          <div className="flex items-baseline gap-[12px]">
            <span className={`font-['Fraunces'] font-bold text-[40px] leading-none ${isOverBudget ? 'text-danger' : 'text-route'}`}>
              ₹{totalCost.toLocaleString()}
            </span>
            <span className="text-[14px] text-muted font-medium font-['IBM_Plex_Mono']">
              ~₹{avgCostPerDay.toLocaleString()}/day
            </span>
          </div>
        </div>

        {/* Budget Progress / Target */}
        <div className="flex-1 max-w-[400px] w-full">
          {budgetTarget ? (
            <div className="flex flex-col gap-[8px]">
              <div className="flex items-center justify-between text-[13px] font-medium font-['IBM_Plex_Mono']">
                <span className={isOverBudget ? 'text-danger' : 'text-ink'}>
                  ₹{totalCost.toLocaleString()} of ₹{budgetTarget.toLocaleString()} budget
                </span>
                <span className={isOverBudget ? 'text-danger' : 'text-muted'}>
                  {pctUsed}% used
                </span>
              </div>
              <div className="h-[8px] w-full bg-surface border border-border rounded-full overflow-hidden">
                <div 
                  className={`h-full ${isOverBudget ? 'bg-danger' : 'bg-success'} transition-all duration-500`} 
                  style={{ width: `${Math.min(100, pctUsed)}%` }}
                ></div>
              </div>
              {isOverBudget && (
                <div className="flex items-center gap-[6px] text-danger text-[12px] font-medium mt-[4px]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[14px] h-[14px]"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  Warning: You are ₹{ (totalCost - budgetTarget).toLocaleString() } over budget!
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-end">
              <button 
                onClick={onSetBudget}
                className="text-[13px] font-medium text-horizon bg-horizon/10 px-[16px] py-[8px] rounded-full hover:bg-horizon hover:text-white transition-colors"
              >
                + Set a budget for this trip
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
