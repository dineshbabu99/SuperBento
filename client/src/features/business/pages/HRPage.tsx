import React, { useState } from 'react';
import {
  useGetEmployeesQuery,
  useUpsertEmployeeMutation,
  useGetPayrollsQuery,
  useGeneratePayrollMutation,
  useUpdatePayrollStatusMutation,
  type EmployeeProfile,
  type PayrollRecord,
} from '../api/businessApi';
import { Button } from '../../../shared/ui/button';

const payrollStatusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
  APPROVED: { label: 'Approved', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  PAID: { label: 'Paid & Disbursed', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-500/15 text-red-600 border-red-500/30' },
};

export const HRPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>('employees');
  const [payPeriod, setPayPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: employees, isLoading: isLoadingEmployees } = useGetEmployeesQuery();
  const { data: payrolls, isLoading: isLoadingPayrolls, refetch: refetchPayrolls } = useGetPayrollsQuery({
    payPeriod: activeTab === 'payroll' ? payPeriod : undefined,
  });

  const [upsertEmployee, { isLoading: isUpserting }] = useUpsertEmployeeMutation();
  const [generatePayroll, { isLoading: isGenerating }] = useGeneratePayrollMutation();
  const [updatePayrollStatus, { isLoading: isUpdatingPayroll }] = useUpdatePayrollStatusMutation();

  // Employee onboarding form state
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Kitchen');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Payroll adjustments form state
  const [adjustTarget, setAdjustTarget] = useState<PayrollRecord | null>(null);
  const [bonus, setBonus] = useState('');
  const [deductions, setDeductions] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId || !designation || !monthlySalary) {
      setError('Please fill in all required fields.');
      return;
    }

    const sal = parseFloat(monthlySalary);
    if (isNaN(sal) || sal < 0) {
      setError('Salary must be a positive number.');
      return;
    }

    try {
      await upsertEmployee({
        userId,
        designation: designation.trim(),
        department,
        monthlySalary: sal,
        joiningDate,
        bankName: bankName.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        ifscCode: ifscCode.trim() || undefined,
      }).unwrap();
      setShowEmployeeModal(false);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to onboard employee.');
    }
  };

  const handleGeneratePayroll = async () => {
    setError(null);
    try {
      const res = await generatePayroll({ payPeriod }).unwrap();
      alert(res.message);
      refetchPayrolls();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to generate payroll.');
    }
  };

  const handleOpenAdjust = (p: PayrollRecord) => {
    setAdjustTarget(p);
    setBonus(String(p.bonus));
    setDeductions(String(p.deductions));
    setAdjustError(null);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    const b = parseFloat(bonus) || 0;
    const d = parseFloat(deductions) || 0;

    try {
      await updatePayrollStatus({
        id: adjustTarget.id,
        status: adjustTarget.status, // Keep status same, just update adjustments
        bonus: b,
        deductions: d,
      }).unwrap();
      setAdjustTarget(null);
    } catch (err: any) {
      setAdjustError(err?.data?.message || 'Failed to save adjustments.');
    }
  };

  const handlePayrollAction = async (id: string, status: 'APPROVED' | 'PAID' | 'CANCELLED') => {
    try {
      await updatePayrollStatus({ id, status }).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || `Failed to update status to ${status}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Human Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage employee directory and monthly payroll disbursement</p>
        </div>
        {activeTab === 'employees' ? (
          <Button onClick={() => { setUserId(''); setDesignation(''); setMonthlySalary(''); setError(null); setShowEmployeeModal(true); }}>
            + Onboard Employee
          </Button>
        ) : (
          <div className="flex gap-2 items-center">
            <input
              type="month"
              className="px-3 py-1.5 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value)}
            />
            <Button onClick={handleGeneratePayroll} disabled={isGenerating}>
              {isGenerating ? 'Processing...' : '⚙ Generate Payroll Run'}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-4 text-sm">
        <button
          className={`pb-2.5 font-medium transition-all ${
            activeTab === 'employees'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('employees')}
        >
          Employee Directory
        </button>
        <button
          className={`pb-2.5 font-medium transition-all ${
            activeTab === 'payroll'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('payroll')}
        >
          Payroll Board
        </button>
      </div>

      {/* Employees Directory Tab */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingEmployees ? (
            <div className="col-span-full p-12 text-center text-muted-foreground">Loading employee files...</div>
          ) : !employees || employees.length === 0 ? (
            <div className="col-span-full p-12 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
              No employee profiles registered yet. Click Onboard Employee to start.
            </div>
          ) : (
            employees.map((emp) => (
              <div key={emp.id} className="bg-card border rounded-lg p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-base">{emp.user.firstName} {emp.user.lastName}</h3>
                      <p className="text-xs text-muted-foreground">{emp.user.email}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 font-medium">
                      Active Staff
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Department</span>
                      <p className="font-medium mt-0.5">{emp.department}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Designation</span>
                      <p className="font-medium mt-0.5">{emp.designation}</p>
                    </div>
                    <div className="col-span-2 border-t pt-2">
                      <span className="text-muted-foreground">Monthly Base Salary</span>
                      <p className="text-sm font-semibold text-primary mt-0.5">₹{emp.monthlySalary.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {emp.bankAccountNumber && (
                  <div className="bg-muted/40 p-2.5 rounded-md text-[10px] text-muted-foreground font-mono space-y-0.5">
                    <p>🏦 {emp.bankName}</p>
                    <p>A/C: {emp.bankAccountNumber}</p>
                    <p>IFSC: {emp.ifscCode}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Payroll Records Tab */}
      {activeTab === 'payroll' && (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b bg-muted/20 flex justify-between items-center">
            <h2 className="font-semibold text-sm">Payroll Run for {payPeriod}</h2>
          </div>

          {isLoadingPayrolls ? (
            <div className="p-12 text-center text-muted-foreground">Loading payroll records...</div>
          ) : !payrolls || payrolls.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border-2 border-dashed mx-6 my-6 rounded-lg">
              No payroll drafts exist for {payPeriod}. Click "Generate Payroll Run" above to draft slips.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground border-b text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Employee</th>
                  <th className="px-6 py-3 font-medium">Base Salary</th>
                  <th className="px-6 py-3 font-medium">Bonus</th>
                  <th className="px-6 py-3 font-medium">Deductions</th>
                  <th className="px-6 py-3 font-medium">Net Payout</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payrolls.map((p) => {
                  const status = payrollStatusConfig[p.status] ?? payrollStatusConfig.DRAFT;
                  return (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium">
                          {p.employeeProfile.user.firstName} {p.employeeProfile.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.employeeProfile.designation} ({p.employeeProfile.department})
                        </p>
                      </td>
                      <td className="px-6 py-4 font-mono">₹{p.basicSalary.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono text-green-600">+₹{p.bonus.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono text-red-600">-₹{p.deductions.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono font-bold text-primary">₹{p.netSalary.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {p.status === 'DRAFT' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleOpenAdjust(p)}>
                              Adjust
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => handlePayrollAction(p.id, 'APPROVED')}
                              disabled={isUpdatingPayroll}
                            >
                              Approve
                            </Button>
                          </>
                        )}
                        {p.status === 'APPROVED' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handlePayrollAction(p.id, 'PAID')}
                            disabled={isUpdatingPayroll}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {p.status !== 'PAID' && p.status !== 'CANCELLED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => handlePayrollAction(p.id, 'CANCELLED')}
                            disabled={isUpdatingPayroll}
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Onboard Employee Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Onboard Employee</h2>
              <button onClick={() => setShowEmployeeModal(false)} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-4 py-2">{error}</div>}

              <div className="space-y-1">
                <label className="text-sm font-medium">Select User ID Context *</label>
                <select
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                >
                  <option value="">-- Choose User --</option>
                  {/* Seeded Driver / Kitchen staff options */}
                  <option value="superadmin-placeholder">Super Admin (Use Seed ID from Users list)</option>
                  {employees?.length === 0 || !employees ? (
                    <option value="super-admin-seed-id">Direct typing of UUID from DB is supported</option>
                  ) : null}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Input User UUID directly:
                  <input
                    type="text"
                    className="w-full mt-1 px-3 py-1 bg-background border rounded-md text-xs focus:outline-none"
                    placeholder="Paste user UUID here (e.g. from Users page)"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Designation *</label>
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    placeholder="e.g. Chef, Executive"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Department</label>
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Kitchen">Kitchen Operations</option>
                    <option value="Delivery">Delivery / Logistics</option>
                    <option value="Finance">Finance & Accounting</option>
                    <option value="HR">Human Resources</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Monthly Salary *</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    placeholder="Base Salary in ₹"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Joining Date *</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bank Account Information</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Bank Name</label>
                    <input
                      className="w-full px-3 py-2 bg-background border rounded-md text-xs focus:outline-none"
                      placeholder="e.g. State Bank of India"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Account Number</label>
                      <input
                        className="w-full px-3 py-2 bg-background border rounded-md text-xs focus:outline-none"
                        placeholder="A/C Number"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">IFSC Code</label>
                      <input
                        className="w-full px-3 py-2 bg-background border rounded-md text-xs focus:outline-none"
                        placeholder="IFSC Code"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowEmployeeModal(false)} disabled={isUpserting}>Cancel</Button>
                <Button type="submit" disabled={isUpserting}>{isUpserting ? 'Onboarding...' : 'Onboard Employee'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Slip Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="font-semibold text-base">Adjust Payroll: {adjustTarget.employeeProfile.user.firstName}</h3>
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              {adjustError && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-md px-3 py-1.5">{adjustError}</div>}
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Bonus (₹)</label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs focus:outline-none"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    disabled={isUpdatingPayroll}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Deductions (₹)</label>
                  <input
                    type="number"
                    className="w-full px-2.5 py-1.5 bg-background border rounded-md text-xs focus:outline-none"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    disabled={isUpdatingPayroll}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdjustTarget(null)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isUpdatingPayroll}>Save Adjustments</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default HRPage;
