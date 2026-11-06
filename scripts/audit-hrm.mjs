// Live localhost acceptance audit. --mutate creates clearly tagged test data.
// Credentials/tokens stay in memory; evidence contains statuses and non-secret facts only.
import { mkdir, writeFile } from 'node:fs/promises'

const root = new URL('../docs/testing/', import.meta.url)
const run = Date.now().toString(36)
const prefix = `TEST-${run}`
const results = []
const fixtures = { prefix, employees: [], users: [], leaves: [], schedules: [], attendance: [], periods: [], catalogs: [] }
const tokens = {}
const now = new Date()
const year = now.getFullYear(), month = now.getMonth() + 1
const date = `${year}-${String(month).padStart(2, '0')}-22`
const range = `from=${year}-01-01&to=${year}-12-31`
async function request(role, method, path, body) {
  const response = await fetch(`http://localhost:8080/api/v1${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(tokens[role] ? { Authorization: `Bearer ${tokens[role]}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000),
  })
  const text = await response.text()
  let data; try { data = JSON.parse(text) } catch { data = text }
  return { status: response.status, data }
}
function check(name, pass, evidence) {
  results.push({ name, result: pass ? 'PASS' : 'FAIL', evidence })
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name} ${JSON.stringify(evidence)}`)
}
async function expectStatus(name, role, method, path, expected, body) {
  const r = await request(role, method, path, body)
  check(name, [].concat(expected).includes(r.status), { method, path, expected, actual: r.status, ...(r.status >= 400 ? { code: r.data?.code, message: r.data?.message } : {}) })
  return r.data
}
async function login(role, username, password = 'password') {
  const r = await request(null, 'POST', '/auth/login', { username, password })
  check(`login ${role}`, r.status === 200 && !!r.data.accessToken, { status: r.status, roles: r.data.user?.roles })
  if (r.data.accessToken) tokens[role] = r.data.accessToken
}
try {
  await expectStatus('anonymous blocked', null, 'GET', '/employees', 401)
  await expectStatus('bad password rejected', null, 'POST', '/auth/login', 401, { username: 'admin', password: 'wrong-audit-password' })
  for (const [r,u] of Object.entries({admin:'admin', hr:'hr.manager', leader:'leader01', employee:'employee01'})) await login(r,u)
  for (const r of ['admin','hr','leader','employee']) await expectStatus(`identity ${r}`,r,'GET','/auth/me',200)
  const employees = await expectStatus('HR employee list', 'hr', 'GET', '/employees?size=100',200)
  const departments = await expectStatus('departments', 'hr', 'GET','/departments',200)
  const positions = await expectStatus('positions', 'hr','GET','/positions',200)
  const shifts = await expectStatus('work shifts','hr','GET','/work-shifts',200)
  const types = await expectStatus('four leave types','employee','GET','/leave-types',200)
  const own = await expectStatus('employee own profile','employee','GET','/employees/me',200)
  const team = await expectStatus('leader team list','leader','GET','/employees?size=100',200)
  const outside = employees.content.find(e => !team.content.some(t => t.id === e.id))
  if (outside) {
    await expectStatus('leader outside employee forbidden','leader','GET',`/employees/${outside.id}`,403)
    await expectStatus('leader outside attendance forbidden','leader','GET',`/attendance?${range}&employeeId=${outside.id}`,403)
    await expectStatus('leader outside schedule forbidden','leader','GET',`/work-schedules?${range}&employeeId=${outside.id}`,403)
    await expectStatus('employee other attendance forbidden','employee','GET',`/attendance?${range}&employeeId=${outside.id}`,403)
  }
  for (const role of ['hr','leader','employee']) await expectStatus(`users forbidden ${role}`,role,'GET','/users',403)
  for (const role of ['leader','employee']) {
    await expectStatus(`reports forbidden ${role}`,role,'GET',`/reports/employees?month=${month}&year=${year}`,403)
    await expectStatus(`create employee forbidden ${role}`,role,'POST','/employees',403,{ employeeCode:'DENIED',fullName:'DENIED',gender:'MALE',phone:'0900000000',email:'denied@example.test',joinDate:'2020-01-01',departmentId:departments[0].id,positionId:positions[0].id })
    await expectStatus(`attendance write forbidden ${role}`,role,'POST','/attendance',403,{employeeId:own.id,attendanceDate:date,status:'PRESENT'})
    await expectStatus(`schedule write forbidden ${role}`,role,'POST','/work-schedules',403,{employeeId:own.id,shiftId:shifts[0].id,workDate:date})
    const rows = await expectStatus(`attendance read ${role}`,role,'GET',`/attendance?${range}`,200)
    const allowedIds = role==='employee' ? [own.id] : team.content.map(e=>e.id)
    check(`attendance scope ${role}`,rows.every(x=>allowedIds.includes(x.employeeId)),{count:rows.length,employeeIds:[...new Set(rows.map(x=>x.employeeId))]})
    const payroll = await expectStatus(`payroll read ${role}`,role,'GET',`/payrolls?year=${year}`,200)
    const profile = role==='employee' ? own : (await request(role,'GET','/employees/me')).data
    check(`payroll scope ${role}`,payroll.every(x=>x.employeeId===profile.id),{count:payroll.length,employeeIds:[...new Set(payroll.map(x=>x.employeeId))]})
  }
  await expectStatus('employee list forbidden (dashboard dependency)','employee','GET','/employees?size=5',403)
  await expectStatus('missing employee 404','hr','GET','/employees/99999999',404)
  await expectStatus('invalid sort rejected with 400','hr','GET','/employees?sort=notAField,asc',400)
  await expectStatus('missing attendance dates 400','hr','GET','/attendance',400)
  const report = await expectStatus('month-end report','hr','GET',`/reports/employees?month=${month}&year=${year}`,200)
  check('report totals agree',report.active+report.onLeave+report.terminated===report.totalEmployees,{active:report.active,onLeave:report.onLeave,terminated:report.terminated,total:report.totalEmployees})
  const reports = await expectStatus('admin reports','admin','GET',`/reports/employees?month=${month}&year=${year}`,200)
  check('HR admin report same',JSON.stringify(report)===JSON.stringify(reports),{total:report.totalEmployees})
  const payrolls=await expectStatus('all payrolls','hr','GET','/payrolls',200)
  const selected=await expectStatus('monthly payroll filter','hr','GET',`/payrolls?month=${month}&year=${year}`,200)
  check('monthly payroll selection',selected.every(x=>x.month===month&&x.year===year),{count:selected.length,total:selected.reduce((s,x)=>s+Number(x.netSalary),0)})
  const annual=await expectStatus('annual payroll summary','employee','GET',`/payrolls/annual-summary?year=${year}`,200)
  const expectedTotal=payrolls.filter(x=>x.employeeId===own.id&&x.year===year).reduce((s,x)=>s+Number(x.netSalary),0)
  check('annual employee sum',Math.abs(annual.totalNetSalary-expectedTotal)<0.01,{actual:annual.totalNetSalary,expected:expectedTotal})
  await expectStatus('payroll invalid month', 'hr','GET','/payrolls?month=13',[400,409])
  await expectStatus('report invalid month', 'hr','GET','/reports/employees?month=13',[400,409])
  check('baseline dashboard facts',true,{employees:employees.totalElements,active:employees.content.filter(e=>e.status==='ACTIVE').length,allPayrollRows:payrolls.length,allPayrollTotal:payrolls.reduce((s,x)=>s+Number(x.netSalary),0),monthPayrollRows:selected.length,monthPayrollTotal:selected.reduce((s,x)=>s+Number(x.netSalary),0)})
  const sort=await expectStatus('API sorting and paging','hr','GET','/employees?page=0&size=2&sort=employeeCode,desc',200)
  check('API page respects size',sort.content.length===Math.min(2,sort.totalElements)&&sort.totalPages===Math.ceil(sort.totalElements/2),{page:sort.page,size:sort.size,total:sort.totalElements,codes:sort.content.map(e=>e.employeeCode)})
  if (process.argv.includes('--mutate')) {
    const department=await expectStatus('create TEST department','hr','POST','/departments',200,{name:prefix,description:'Acceptance test only'})
    fixtures.catalogs.push({type:'department',id:department.id,name:prefix})
    const position=await expectStatus('create TEST position','hr','POST','/positions',200,{title:prefix,defaultAllowance:0})
    fixtures.catalogs.push({type:'position',id:position.id,name:prefix})
    const body={employeeCode:prefix,fullName:`${prefix} Nhân viên`,gender:'FEMALE',phone:'0909999999',email:`${run}@example.test`,joinDate:'2025-01-01',departmentId:department.id,positionId:position.id,educationLevel:'Đại học'}
    const person=await expectStatus('HR create employee','hr','POST','/employees',200,body)
    if (!person.id) throw Error('Fixture employee creation failed')
    fixtures.employees.push({id:person.id,code:person.employeeCode})
    const person2=await expectStatus('Admin create employee','admin','POST','/employees',200,{...body,employeeCode:prefix+'-B',email:`${run}-b@example.test`,fullName:`${prefix} Nhân viên B`})
    fixtures.employees.push({id:person2.id,code:person2.employeeCode})
    await expectStatus('duplicate employee code','hr','POST','/employees',409,{...body,email:`${run}-dup@example.test`})
    await expectStatus('duplicate employee email','hr','POST','/employees',409,{...body,employeeCode:prefix+'-DUP'})
    await expectStatus('future join date rejected','hr','POST','/employees',400,{...body,employeeCode:prefix+'-FUT',email:`${run}-fut@example.test`,joinDate:'2099-01-01'})
    const userBody={username:`test.${run}`,password:'AuditTest2026!',displayName:prefix,roles:['EMPLOYEE'],status:'ACTIVE',employeeId:person.id}
    const account=await expectStatus('Admin create account linked','admin','POST','/users',201,userBody)
    fixtures.users.push({id:account.id,username:account.username})
    await expectStatus('duplicate username','admin','POST','/users',409,userBody)
    await login('test',account.username,'AuditTest2026!')
    await expectStatus('own profile invalid email','test','PATCH','/employees/me',400,{email:'invalid',phone:'0900000000'})
    const updated=await expectStatus('own profile update','test','PATCH','/employees/me',200,{email:`${run}-updated@example.test`,phone:'0908888888',status:'TERMINATED',fullName:'Escalated',departmentId:departments[0].id,roles:['ADMIN']})
    check('sensitive fields ignored',updated.fullName===body.fullName&&updated.status==='ACTIVE'&&updated.departmentId===department.id,{status:updated.status,fullName:updated.fullName,departmentId:updated.departmentId})
    await expectStatus('profile duplicate email','test','PATCH','/employees/me',409,{email:own.email,phone:'0908888888'})
    await expectStatus('promote TEST leader','admin','PUT',`/users/${account.id}/roles`,200,{roles:['TEAM_LEADER']})
    await expectStatus('role change effective for existing token','test','GET','/employees',200)
    await expectStatus('restore TEST employee role','admin','PUT',`/users/${account.id}/roles`,200,{roles:['EMPLOYEE']})
    await expectStatus('role revocation enforced','test','GET','/employees',403)
    await expectStatus('lock TEST account','admin','PATCH',`/users/${account.id}/status`,200,{status:'LOCKED'})
    await expectStatus('locked login blocked',null,'POST','/auth/login',[401,403],{username:account.username,password:'AuditTest2026!'})
    await expectStatus('locked existing JWT blocked','test','GET','/employees/me',[401,403])
    await expectStatus('unlock TEST account','admin','PATCH',`/users/${account.id}/status`,200,{status:'ACTIVE'})
    for (let i=0;i<types.length;i++) {
      const day=String(i+1).padStart(2,'0'), ld=`2098-01-${day}`
      const leave=await expectStatus(`create ${types[i].code} leave`,'test','POST','/leave-requests',200,{leaveTypeId:types[i].id,fromDate:ld,toDate:ld,reason:prefix})
      fixtures.leaves.push({id:leave.id})
      if(i===0) {
        await expectStatus('overlapping leave rejected','test','POST','/leave-requests',409,{leaveTypeId:types[i].id,fromDate:ld,toDate:ld,reason:prefix})
        await expectStatus('other employee cannot cancel','employee','PATCH',`/leave-requests/${leave.id}/cancel`,403)
        await expectStatus('employee cannot review','test','PATCH',`/leave-requests/${leave.id}/review`,403,{status:'APPROVED'})
        await expectStatus('Admin can review without employee link','admin','PATCH',`/leave-requests/${leave.id}/review`,200,{status:'APPROVED'})
        await expectStatus('HR cannot approve already approved leave','hr','PATCH',`/leave-requests/${leave.id}/review`,409,{status:'APPROVED'})
        await expectStatus('cannot cancel approved leave','test','PATCH',`/leave-requests/${leave.id}/cancel`,409)
        await expectStatus('cannot review twice','hr','PATCH',`/leave-requests/${leave.id}/review`,409,{status:'REJECTED'})
      } else if(i===1) await expectStatus('HR rejects leave','hr','PATCH',`/leave-requests/${leave.id}/review`,200,{status:'REJECTED',rejectionReason:prefix})
      else await expectStatus('cancel own pending leave','test','PATCH',`/leave-requests/${leave.id}/cancel`,[200,204])
    }
    await expectStatus('reversed leave dates rejected','test','POST','/leave-requests',409,{leaveTypeId:types[0].id,fromDate:'2098-02-05',toDate:'2098-02-01',reason:prefix})
    const contract=await expectStatus('create TEST contract','hr','POST','/contracts',200,{employeeId:person.id,contractNumber:prefix,contractType:'TEST',startDate:'2025-01-01',baseSalary:26000000,allowance:500000})
    fixtures.contractId=contract.id
    const scheduleBody={employeeId:person.id,shiftId:shifts[0].id,workDate:'2099-12-01',note:prefix}
    const schedule=await expectStatus('create TEST schedule','hr','POST','/work-schedules',200,scheduleBody)
    fixtures.schedules.push({id:schedule.id})
    await expectStatus('duplicate schedule rejected','hr','POST','/work-schedules',409,scheduleBody)
    const attendanceBody={employeeId:person.id,scheduleId:schedule.id,attendanceDate:'2099-12-01',checkIn:'08:00',checkOut:'18:00',status:'PRESENT'}
    const attendance=await expectStatus('attendance with overtime','hr','POST','/attendance',200,attendanceBody)
    fixtures.attendance.push({id:attendance.id})
    check('overtime calculation',attendance.workedHours===8&&attendance.overtimeHours===2,{worked:attendance.workedHours,overtime:attendance.overtimeHours})
    await expectStatus('duplicate attendance rejected','hr','POST','/attendance',409,attendanceBody)
    await expectStatus('reversed attendance time','hr','POST','/attendance',409,{...attendanceBody,scheduleId:null,attendanceDate:'2099-12-02',checkIn:'18:00',checkOut:'08:00'})
    const mismatch=await request('hr','POST','/attendance',{...attendanceBody,attendanceDate:'2099-12-03',status:'ABSENT'})
    check('attendance date must match schedule',[400,409].includes(mismatch.status),{status:mismatch.status,recordDate:mismatch.data.attendanceDate,scheduleDate:scheduleBody.workDate})
    if(mismatch.data.id) fixtures.attendance.push({id:mismatch.data.id})
    const absent=await expectStatus('absence entry','hr','POST','/attendance',200,{...attendanceBody,scheduleId:null,attendanceDate:'2099-12-04',checkOut:'17:00',status:'ABSENT'})
    fixtures.attendance.push({id:absent.id})
    check('absence must have zero worked/overtime',absent.workedHours===0&&absent.overtimeHours===0,{worked:absent.workedHours,overtime:absent.overtimeHours,status:absent.status})
    const periodExists=await request('hr','GET','/payroll-periods?month=12&year=2099')
    if(periodExists.data.length===0) {
      const period=await expectStatus('create TEST payroll period','hr','POST','/payroll-periods',200,{month:12,year:2099})
      fixtures.periods.push({id:period.id,month:12,year:2099})
      await expectStatus('duplicate payroll period rejected','hr','POST','/payroll-periods',409,{month:12,year:2099})
      await expectStatus('cannot lock empty payroll','hr','PATCH',`/payroll-periods/${period.id}/lock`,409)
      const generated=await expectStatus('generate TEST payroll','hr','POST',`/payroll-periods/${period.id}/generate`,200)
      const target=generated.find(p=>p.employeeId===person.id)
      const rule=(await request('hr','GET','/payrolls/calculation-rule')).data
      const expected=26000000/rule.standardWorkDays+500000+2*(26000000/rule.standardWorkDays/8)*rule.overtimeMultiplier
      check('payroll excludes absent overtime',Math.abs(target.netSalary-expected)<1,{expected,actual:target.netSalary,days:target.workedDays,overtime:target.overtimeHours})
      await expectStatus('lock TEST payroll','hr','PATCH',`/payroll-periods/${period.id}/lock`,200)
      await expectStatus('locked payroll cannot regenerate','hr','POST',`/payroll-periods/${period.id}/generate`,409)
      const ownPayroll=(await request('test','GET','/payrolls?month=12&year=2099')).data
      check('TEST employee only own locked payroll',ownPayroll.length===1&&ownPayroll[0].employeeId===person.id&&ownPayroll[0].status==='LOCKED',{count:ownPayroll.length,status:ownPayroll[0]?.status})
    }
    await expectStatus('HR soft terminate TEST','hr','DELETE',`/employees/${person2.id}`,200)
    const terminated=await expectStatus('terminated employee history retained','hr','GET',`/employees/${person2.id}`,200)
    check('termination stamps end date',terminated.status==='TERMINATED'&&!!terminated.endDate,{status:terminated.status,endDate:terminated.endDate})
    const logs=await expectStatus('audit logs available','admin','GET','/audit-logs',200)
    check('role/status/leave changes audited',['ROLE_CHANGED','STATUS_CHANGED','LEAVE_REVIEWED'].every(action=>logs.some(l=>l.action===action)),{actions:[...new Set(logs.map(l=>l.action))]})
    // Remove only the account created by this run. History-bearing employees are soft-deleted.
    const accounts=(await request('admin','GET','/users')).data
    const created=accounts.find(a=>a.id===account.id&&a.username===userBody.username)
    if(created) await expectStatus('delete TEST account','admin','DELETE',`/users/${created.id}`,204)
    await expectStatus('deleted login blocked',null,'POST','/auth/login',401,{username:userBody.username,password:'AuditTest2026!'})
    await expectStatus('Admin soft terminate TEST','admin','DELETE',`/employees/${person.id}`,200)
  }
} catch(error) { check('audit execution',false,{error:error.message}) }
await mkdir(root,{recursive:true})
const evidence={run,createdAt:new Date().toISOString(),results,fixtures}
await writeFile(new URL(`api-audit-${run}.json`,root),JSON.stringify(evidence,null,2))
console.log(JSON.stringify({run,total:results.length,passed:results.filter(r=>r.result==='PASS').length,failed:results.filter(r=>r.result==='FAIL').length,fixtures},null,2))
process.exitCode = results.some(result => result.result === 'FAIL') ? 1 : 0
