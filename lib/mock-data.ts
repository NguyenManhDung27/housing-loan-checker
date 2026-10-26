export type Role = "customer" | "cs_staff" | "appraiser" | "admin";
export type ApplicationStatus = "draft" | "submitted" | "in_review" | "needs_more_info" | "completed";
export type PreliminaryResult = "none" | "meets" | "not_meets" | "needs_review";

export type DocumentItem = {
  id: string;
  name: string;
  group: string;
  required: boolean;
  status: "missing" | "submitted" | "needs_more_info" | "confirmed";
  note?: string;
};

export type Application = {
  id: string;
  title: string;
  type: string;
  status: ApplicationStatus;
  preliminaryResult: PreliminaryResult;
  updatedAt: string;
  version: number;
  assignedTo: string;
  documents: DocumentItem[];
};

export type Ticket = { id: string; subject: string; message: string; status: string; updatedAt: string };

export const roleLabels: Record<Role, string> = {
  customer: "Khách hàng",
  cs_staff: "Nhân viên quan hệ khách hàng",
  appraiser: "Nhân viên thẩm định",
  admin: "Quản trị viên",
};

export const seedApplications: Application[] = [{
  id: "HL-240617-001",
  title: "Hồ sơ vay mua nhà của Nguyễn An",
  type: "Vay mua nhà cá nhân",
  status: "needs_more_info",
  preliminaryResult: "none",
  updatedAt: "17/06/2024, 09:42",
  version: 1,
  assignedTo: "thamdinh1@housingloan.vn",
  documents: [
    { id: "cccd", name: "CCCD / Hộ chiếu", group: "Pháp lý khách hàng", required: true, status: "confirmed", note: "Đã xác nhận" },
    { id: "employment", name: "Hợp đồng lao động", group: "Chứng minh tài chính", required: true, status: "submitted" },
    { id: "bank", name: "Sao kê tài khoản 6 tháng", group: "Chứng minh tài chính", required: true, status: "needs_more_info", note: "Thiếu tháng 03/2024" },
    { id: "sale", name: "Hợp đồng mua bán nhà", group: "Mục đích vay", required: true, status: "missing" },
  ],
}];

export const seedTickets: Ticket[] = [{ id: "HT-001", subject: "Hỏi về sao kê tài khoản", message: "Tôi cần bổ sung sao kê tháng 03/2024 bằng cách nào?", status: "waiting_customer", updatedAt: "17/06/2024" }];
