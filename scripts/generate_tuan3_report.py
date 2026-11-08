# scripts/generate_tuan3_report.py
# -*- coding: utf-8 -*-
"""
Script to generate the Week 3 Word Report (.docx) for HRM Binh An.
Topic: Lập bảng câu hỏi cho việc phân tích hệ thống thông tin.
Meets all criteria:
1. Đối tượng được hỏi
2. Phục vụ cho module nào
3. Đáp án theo các thang đo (Likert, Nominal, Ordinal, Dichotomous, Frequency)
4. Tối thiểu 20 câu hỏi (28 câu hỏi chi tiết + 5 phiếu khảo sát mẫu)
5. Nộp bài đúng thư mục: "2. ĐỒ ÁN/ 2026.09.22 – BC DA"
"""

import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set cell padding in dxa (1 pt = 20 dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    """Set cell background color."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
    """Set standard subtle borders for a table."""
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def format_row(row, is_header=False, bg_color=None, bold=False, font_size=10, align=WD_ALIGN_PARAGRAPH.LEFT):
    for cell in row.cells:
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        if bg_color:
            set_cell_shading(cell, bg_color)
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        for p in cell.paragraphs:
            p.alignment = align
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            for r in p.runs:
                r.font.name = 'Times New Roman'
                r.font.size = Pt(font_size)
                if bold or is_header:
                    r.font.bold = True
                if is_header:
                    r.font.color.rgb = RGBColor(255, 255, 255)

def add_header_footer(doc):
    for s in doc.sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(0.8)
        
        # Header
        hdr = s.header
        p_hdr = hdr.paragraphs[0]
        p_hdr.text = "ĐỒ ÁN HỆ THỐNG THÔNG TIN DOANH NGHIỆP — NHÓM 7 | TUẦN 3"
        p_hdr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        if p_hdr.runs:
            p_hdr.runs[0].font.name = 'Times New Roman'
            p_hdr.runs[0].font.size = Pt(8.5)
            p_hdr.runs[0].font.color.rgb = RGBColor(128, 128, 128)
            
        # Footer
        ftr = s.footer
        p_ftr = ftr.paragraphs[0]
        p_ftr.text = "Báo cáo phân tích hệ thống — HRM Trung tâm Ngoại ngữ Bình An"
        p_ftr.alignment = WD_ALIGN_PARAGRAPH.CENTER
        if p_ftr.runs:
            p_ftr.runs[0].font.name = 'Times New Roman'
            p_ftr.runs[0].font.size = Pt(8.5)
            p_ftr.runs[0].font.color.rgb = RGBColor(128, 128, 128)

def build_document():
    doc = docx.Document()
    
    # Configure base styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Times New Roman'
    style_normal.font.size = Pt(12)
    style_normal.font.color.rgb = RGBColor(30, 30, 30)
    style_normal.paragraph_format.line_spacing = 1.25
    style_normal.paragraph_format.space_after = Pt(4)
    
    add_header_footer(doc)
    
    # -------------------------------------------------------------
    # TRANG BÌA (COVER PAGE)
    # -------------------------------------------------------------
    p_uni = doc.add_paragraph()
    p_uni.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_uni.paragraph_format.space_after = Pt(2)
    r1 = p_uni.add_run("TRƯỜNG ĐẠI HỌC SÀI GÒN\n")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(13)
    r1.font.bold = True
    r2 = p_uni.add_run("KHOA CÔNG NGHỆ THÔNG TIN — BỘ MÔN HỆ THỐNG THÔNG TIN\n")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(12)
    r2.font.bold = True
    r3 = p_uni.add_run("-------------------------------------\n\n")
    r3.font.name = 'Times New Roman'
    r3.font.size = Pt(11)
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(24)
    p_title.paragraph_format.space_after = Pt(18)
    
    r_t0 = p_title.add_run("BÁO CÁO TIẾN ĐỘ ĐỒ ÁN — TUẦN 3\n")
    r_t0.font.name = 'Times New Roman'
    r_t0.font.size = Pt(16)
    r_t0.font.bold = True
    r_t0.font.color.rgb = RGBColor(31, 78, 121)
    
    r_t1 = p_title.add_run("HỌC PHẦN: HỆ THỐNG THÔNG TIN DOANH NGHIỆP (MÃ HP: 841065)\n\n")
    r_t1.font.name = 'Times New Roman'
    r_t1.font.size = Pt(13)
    r_t1.font.bold = True
    r_t1.font.color.rgb = RGBColor(47, 85, 151)
    
    r_t2 = p_title.add_run("ĐỀ TÀI: XÂY DỰNG BẢNG CÂU HỎI KHẢO SÁT VÀ THU THẬP YÊU CẦU PHÂN TÍCH HỆ THỐNG QUẢN LÝ NHÂN SỰ (HRM)\n")
    r_t2.font.name = 'Times New Roman'
    r_t2.font.size = Pt(16)
    r_t2.font.bold = True
    r_t2.font.color.rgb = RGBColor(16, 44, 87)
    
    r_t3 = p_title.add_run("ĐƠN VỊ ỨNG DỤNG: TRUNG TÂM NGOẠI NGỮ BÌNH AN")
    r_t3.font.name = 'Times New Roman'
    r_t3.font.size = Pt(14)
    r_t3.font.bold = True
    r_t3.font.color.rgb = RGBColor(47, 85, 151)
    
    doc.add_paragraph("\n")
    
    # Khung thông tin sinh viên & nhóm
    t_info = doc.add_table(rows=6, cols=2)
    t_info.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_info, color="B0C4DE", sz="6")
    
    info_data = [
        ("Giảng viên hướng dẫn:", "TS. / ThS. Giảng viên phụ trách môn học"),
        ("Nhóm thực hiện:", "NHÓM 07 (Lớp: Đồ án HTTT Doanh nghiệp)"),
        ("Sinh viên phụ trách chính:", "BÙI MINH QUANG — MSSV: 3123411240 (Nhóm trưởng)"),
        ("Các thành viên nhóm:", "1. Nguyễn Thái Quân — MSSV: 3123411246\n"
                                "2. Đỗ Vĩ Ngạn — MSSV: 3123411195\n"
                                "3. Lưu Chấn Hào — MSSV: 3123411083\n"
                                "4. Nguyễn Trường Thành — MSSV: 3123411270"),
        ("Thời gian nộp bài:", "Ngày 22 tháng 09 năm 2026"),
        ("Thư mục nộp bài:", "Folder: 2. ĐỒ ÁN / 2026.09.22 – BC DA")
    ]
    
    for idx, (label, val) in enumerate(info_data):
        row = t_info.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        c0.text = label
        c1.text = val
        format_row(row, is_header=False, font_size=11)
        c0.paragraphs[0].runs[0].font.bold = True
        set_cell_shading(c0, "F2F4F8")
    
    p_bot = doc.add_paragraph()
    p_bot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_bot.paragraph_format.space_before = Pt(36)
    r_bot = p_bot.add_run("TP. HỒ CHÍ MINH — THÁNG 09/2026")
    r_bot.font.name = 'Times New Roman'
    r_bot.font.size = Pt(11)
    r_bot.font.bold = True
    
    doc.add_page_break()
    
    # -------------------------------------------------------------
    # BẢNG PHÂN CÔNG NHIỆM VỤ & ĐÁNH GIÁ TUẦN 3
    # -------------------------------------------------------------
    h1 = doc.add_heading("THÔNG TIN NHÓM & BẢNG PHÂN CÔNG NHIỆM VỤ TUẦN 3", level=1)
    h1.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    p_pc = doc.add_paragraph(
        "Nhóm 07 cam kết 100% thành viên tham gia tích cực vào quá trình khảo sát, thu thập yêu cầu "
        "và thiết kế bảng câu hỏi phân tích hệ thống HRM cho Trung tâm Ngoại ngữ Bình An."
    )
    
    t_assign = doc.add_table(rows=6, cols=5)
    t_assign.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_assign, color="C0C0C0", sz="4")
    
    headers_assign = ["STT", "Họ và tên", "MSSV", "Nhiệm vụ phụ trách Tuần 3", "Đánh giá"]
    for i, h in enumerate(headers_assign):
        t_assign.rows[0].cells[i].text = h
    format_row(t_assign.rows[0], is_header=True, bg_color="1F4E79", bold=True, font_size=10.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    
    assign_data = [
        ("1", "Bùi Minh Quang (Trưởng nhóm)", "3123411240", "Chủ trì thiết kế bảng câu hỏi; Module Quản trị tài khoản, RBAC & Lương", "100% (Hoàn thành tốt)"),
        ("2", "Nguyễn Thái Quân", "3123411246", "Thiết kế bảng câu hỏi Module Hồ sơ nhân sự, Hợp đồng & Cơ cấu tổ chức", "100% (Hoàn thành tốt)"),
        ("3", "Đỗ Vĩ Ngạn", "3123411195", "Thiết kế bảng câu hỏi Module Ca làm việc, Lịch làm việc & Chấm công", "100% (Hoàn thành tốt)"),
        ("4", "Lưu Chấn Hào", "3123411083", "Thiết kế bảng câu hỏi Module Đơn từ, Nghỉ phép & Phê duyệt", "100% (Hoàn thành tốt)"),
        ("5", "Nguyễn Trường Thành", "3123411270", "Thiết kế câu hỏi Module Báo cáo, Dashboard & Audit Log, Backup CSDL", "100% (Hoàn thành tốt)")
    ]
    
    col_widths_assign = [Inches(0.6), Inches(2.0), Inches(1.1), Inches(2.2), Inches(1.2)]
    for r_idx, row_val in enumerate(assign_data, start=1):
        row = t_assign.rows[r_idx]
        for c_idx, val in enumerate(row_val):
            row.cells[c_idx].text = val
            row.cells[c_idx].width = col_widths_assign[c_idx]
        bg = "F9FAFC" if r_idx % 2 == 1 else "FFFFFF"
        format_row(row, is_header=False, bg_color=bg, font_size=10)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[4].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("\n")
    
    # -------------------------------------------------------------
    # MỤC LỤC
    # -------------------------------------------------------------
    h_toc = doc.add_heading("MỤC LỤC BÁO CÁO", level=1)
    h_toc.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    toc_items = [
        ("CHƯƠNG 1. TỔNG QUAN VỀ KHẢO SÁT & THU THẬP YÊU CẦU HỆ THỐNG HRM", "3"),
        ("  1.1. Bối cảnh bài toán nghiệp vụ tại Trung tâm Ngoại ngữ Bình An", "3"),
        ("  1.2. Mục đích và tầm quan trọng của việc khảo sát hệ thống trong Tuần 3", "3"),
        ("  1.3. Xác định các đối tượng được khảo sát (Stakeholders & Actors)", "4"),
        ("  1.4. Phân rã các phân hệ (Modules) của hệ thống HRM Bình An", "4"),
        ("  1.5. Cơ sở lý thuyết về các thang đo khảo sát trong Phân tích hệ thống", "5"),
        ("CHƯƠNG 2. BẢNG CÂU HỎI KHẢO SÁT PHÂN TÍCH HỆ THỐNG CHI TIẾT", "6"),
        ("  2.1. Ma trận tổng thể 28 câu hỏi khảo sát phân tích hệ thống", "6"),
        ("  2.2. Nhóm câu hỏi Module 1: Quản trị hệ thống & Phân quyền RBAC (Câu 1 - 4)", "7"),
        ("  2.3. Nhóm câu hỏi Module 2: Hồ sơ nhân viên, Hợp đồng & Tổ chức (Câu 5 - 8)", "8"),
        ("  2.4. Nhóm câu hỏi Module 3: Phân ca & Quản lý Lịch làm việc (Câu 9 - 11)", "9"),
        ("  2.5. Nhóm câu hỏi Module 4: Quản lý Chấm công & Tăng ca (Câu 12 - 15)", "10"),
        ("  2.6. Nhóm câu hỏi Module 5: Quản lý Đơn từ & Phê duyệt nghỉ phép (Câu 16 - 19)", "11"),
        ("  2.7. Nhóm câu hỏi Module 6: Quản lý Tính lương & Kỳ lương (Câu 20 - 23)", "12"),
        ("  2.8. Nhóm câu hỏi Module 7: Báo cáo Thống kê & Dashboard (Câu 24 - 26)", "13"),
        ("  2.9. Nhóm câu hỏi Module 8: An toàn dữ liệu, Audit Log & Sao lưu CSDL (Câu 27 - 28)", "14"),
        ("CHƯƠNG 3. PHIẾU KHẢO SÁT THỰC ĐỊA DÀNH CHO CÁC ĐỐI TƯỢNG (SURVEY FORMS)", "15"),
        ("  3.1. Phiếu A: Khảo sát dành cho Ban Giám đốc & Kế toán", "15"),
        ("  3.2. Phiếu B: Khảo sát dành cho Quản lý Nhân sự (HR Manager)", "16"),
        ("  3.3. Phiếu C: Khảo sát dành cho Trưởng bộ phận / Trưởng nhóm (Leader)", "17"),
        ("  3.4. Phiếu D: Khảo sát dành cho Giảng viên & Nhân viên", "18"),
        ("  3.5. Phiếu E: Khảo sát dành cho Quản trị viên hệ thống (IT/Admin)", "19"),
        ("CHƯƠNG 4. TỔNG HỢP KẾT QUẢ KHẢO SÁT & MA TRẬN YÊU CẦU HỆ THỐNG", "20"),
        ("  4.1. Bảng số liệu khảo sát thực tế và phân tích định lượng", "20"),
        ("  4.2. Ma trận chuyển hóa kết quả khảo sát thành Yêu cầu chức năng (FR)", "21"),
        ("  4.3. Quy tắc nghiệp vụ và ràng buộc toàn vẹn cơ sở dữ liệu đúc kết từ khảo sát", "22"),
        ("CHƯƠNG 5. KẾT LUẬN & KẾ HOẠCH BÀI LÀM TUẦN 4", "23")
    ]
    
    for title, page in toc_items:
        p_t = doc.add_paragraph()
        p_t.paragraph_format.line_spacing = 1.15
        p_t.paragraph_format.space_after = Pt(2)
        r_title = p_t.add_run(title)
        r_title.font.name = 'Times New Roman'
        r_title.font.size = Pt(11)
        if title.startswith("CHƯƠNG"):
            r_title.font.bold = True
            
        # Tab stop and dots
        dots_len = max(2, 85 - len(title))
        r_dots = p_t.add_run(" " + "." * dots_len + " ")
        r_dots.font.name = 'Times New Roman'
        r_dots.font.size = Pt(10)
        r_dots.font.color.rgb = RGBColor(160, 160, 160)
        
        r_page = p_t.add_run(page)
        r_page.font.name = 'Times New Roman'
        r_page.font.size = Pt(11)
        if title.startswith("CHƯƠNG"):
            r_page.font.bold = True

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHƯƠNG 1
    # -------------------------------------------------------------
    c1 = doc.add_heading("CHƯƠNG 1. TỔNG QUAN VỀ KHẢO SÁT & THU THẬP YÊU CẦU HỆ THỐNG HRM", level=1)
    c1.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    doc.add_heading("1.1. Bối cảnh bài toán nghiệp vụ tại Trung tâm Ngoại ngữ Bình An", level=2)
    doc.add_paragraph(
        "Trung tâm Ngoại ngữ Bình An là cơ sở đào tạo ngoại ngữ chuyên sâu cung cấp các chương trình đào tạo đa dạng "
        "như tiếng Anh giao tiếp, tiếng Anh trẻ em, luyện thi chứng chỉ quốc tế (IELTS, TOEIC) và các lớp học theo hợp đồng "
        "doanh nghiệp. Quy mô nhân sự của trung tâm gồm hơn 50 nhân sự thường trực và cộng tác viên, bao gồm: "
        "Ban Giám đốc, Phòng Quản lý Nhân sự, Phòng Đào tạo (các trưởng nhóm học thuật, giảng viên bản ngữ, giảng viên Việt Nam, trợ giảng), "
        "Phòng Vận hành & Tuyển sinh (tư vấn viên, hành chính) và Bộ phận Kế toán tài chính."
    )
    doc.add_paragraph(
        "Hiện tại, trung tâm đang đối mặt với bài toán quản lý phân tán nghiêm trọng: thông tin nhân sự lưu rải rác trên hồ sơ giấy và "
        "nhiều file Excel độc lập; việc phân ca dạy và lịch trực ca tối/cuối tuần thường xảy ra trùng lặp; đơn xin nghỉ phép gửi qua Zalo, "
        "email dẫn đến thất lạc; dữ liệu chấm công đối soát thủ công vào cuối tháng mất nhiều ngày và dễ xảy ra sai sót khi tính lương; "
        "đặc biệt nhân viên không có kênh bảo mật để tra cứu chi tiết phiếu lương cá nhân."
    )
    
    doc.add_heading("1.2. Mục đích và tầm quan trọng của việc khảo sát hệ thống trong Tuần 3", level=2)
    doc.add_paragraph(
        "Giai đoạn khảo sát và thu thập yêu cầu (Requirements Elicitation) là bước nền tảng quyết định sự thành bại của toàn bộ dự án "
        "xây dựng Hệ thống thông tin. Việc xây dựng một bảng câu hỏi khảo sát khoa học, định lượng và bám sát thực tế giúp nhóm đạt được các mục tiêu sau:"
    )
    
    bullet_points_12 = [
        ("Thu thập chính xác nhu cầu thực tế:", "Lắng nghe trực tiếp khó khăn, kỳ vọng từ tất cả các bên liên quan (từ Ban Giám đốc đến giảng viên, nhân viên)."),
        ("Xác định ranh giới và phạm vi hệ thống:", "Làm rõ các chức năng bắt buộc phải có trong phiên bản mô phỏng lõi (Core MVP) và các chức năng mở rộng."),
        ("Chuẩn hóa các quy tắc nghiệp vụ (Business Rules):", "Xác định rõ ràng các điều kiện biên, công thức tính toán, quy tắc chống trùng lặp dữ liệu."),
        ("Làm cơ sở thiết kế CSDL và kiến trúc API:", "Chuyển hóa dữ liệu khảo sát thành các thực thể, thuộc tính, khóa chính (PK), khóa ngoại (FK) và ràng buộc toàn vẹn (UNIQUE, NOT NULL, CHECK).")
    ]
    for b_title, b_desc in bullet_points_12:
        p_b = doc.add_paragraph(style='List Bullet')
        r_bt = p_b.add_run(b_title + " ")
        r_bt.bold = True
        p_b.add_run(b_desc)

    doc.add_heading("1.3. Xác định các đối tượng được khảo sát (Stakeholders & Actors)", level=2)
    doc.add_paragraph(
        "Để đảm bảo tính khách quan và bao quát, nhóm đã phân loại đối tượng khảo sát thành 6 nhóm tác nhân chính:"
    )
    
    t_actors = doc.add_table(rows=7, cols=3)
    t_actors.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_actors, color="C0C0C0", sz="4")
    
    headers_actors = ["Đối tượng khảo sát", "Vai trò trong tổ chức", "Nhu cầu thông tin trọng tâm"]
    for i, h in enumerate(headers_actors):
        t_actors.rows[0].cells[i].text = h
    format_row(t_actors.rows[0], is_header=True, bg_color="1F4E79", bold=True, font_size=10.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    
    actors_data = [
        ("Ban Giám đốc (BOD)", "Ra quyết định chiến lược, duyệt ngân sách", "Báo cáo biến động nhân sự, tỷ lệ nghỉ phép, tổng chi phí quỹ lương."),
        ("Quản lý Nhân sự (HR Manager)", "Quản trị toàn diện vòng đời nhân sự", "Quản lý hồ sơ, hợp đồng, phê duyệt đơn nghỉ, tổng hợp công và tính lương."),
        ("Trưởng bộ phận / Trưởng nhóm (Leader)", "Quản lý chuyên môn đào tạo, vận hành", "Xếp ca làm việc, duyệt lịch làm việc của nhóm, xác nhận làm thêm giờ (OT)."),
        ("Giảng viên & Nhân viên (Employee)", "Lực lượng trực tiếp giảng dạy và vận hành", "Xem ca làm, chấm công vào/ra, làm đơn nghỉ phép, xem và in phiếu lương cá nhân."),
        ("Kế toán viên (Accountant)", "Đối soát và chi trả thu nhập nhân sự", "Kiểm tra bảng lương, các khoản phụ cấp, giảm trừ, tạm ứng và chốt kỳ lương."),
        ("Quản trị hệ thống (System Admin / IT)", "Vận hành kỹ thuật, an ninh hệ thống", "Cấp tài khoản, phân quyền vai trò (RBAC), xem audit log, sao lưu và phục hồi CSDL.")
    ]
    
    col_widths_actors = [Inches(1.8), Inches(2.3), Inches(3.0)]
    for r_idx, row_val in enumerate(actors_data, start=1):
        row = t_actors.rows[r_idx]
        for c_idx, val in enumerate(row_val):
            row.cells[c_idx].text = val
            row.cells[c_idx].width = col_widths_actors[c_idx]
        bg = "F9FAFC" if r_idx % 2 == 1 else "FFFFFF"
        format_row(row, is_header=False, bg_color=bg, font_size=10)
        row.cells[0].paragraphs[0].runs[0].font.bold = True

    doc.add_paragraph("\n")
    doc.add_heading("1.4. Phân rã các phân hệ (Modules) của hệ thống HRM Bình An", level=2)
    doc.add_paragraph(
        "Hệ thống HRM Bình An được thiết kế dạng module hóa cao (Modular Architecture), bao gồm 8 module chức năng chính:"
    )
    
    modules_list = [
        ("Module 1 - Quản trị hệ thống & Phân quyền RBAC:", "Quản lý tài khoản đăng nhập (users), danh mục vai trò (roles), quyền hạn chi tiết (permissions) và ma trận ánh xạ (user_roles, role_permissions)."),
        ("Module 2 - Quản lý Hồ sơ nhân sự, Hợp đồng & Cơ cấu tổ chức:", "Quản lý cây phòng ban (departments), chức vụ (positions), hồ sơ chi tiết nhân viên (employees) và hợp đồng lao động (employment_contracts)."),
        ("Module 3 - Phân ca & Quản lý Lịch làm việc:", "Định nghĩa ca làm việc (work_shifts: ca sáng, ca tối, ca hành chính) và lập lịch làm việc chi tiết cho nhân sự (work_schedules)."),
        ("Module 4 - Quản lý Chấm công & Tăng ca:", "Ghi nhận giờ vào, giờ ra, số giờ làm việc thực tế, số giờ làm thêm giờ ngoài ca (attendance_records)."),
        ("Module 5 - Quản lý Đơn từ & Phê duyệt nghỉ phép:", "Quản lý danh mục loại nghỉ phép (leave_types), tiếp nhận đơn xin nghỉ (leave_requests), kiểm tra trùng ngày và xử lý quy trình phê duyệt."),
        ("Module 6 - Quản lý Tính lương & Kỳ lương:", "Định nghĩa kỳ lương (payroll_periods), cài đặt tham số lương (salary_settings), tính toán bảng lương (payrolls, payroll_items) và cơ chế khóa kỳ lương (LOCKED)."),
        ("Module 7 - Báo cáo Thống kê & Dashboard Nhân sự:", "Hiển thị chỉ số KPI tổng quan, biểu đồ cơ cấu nhân sự theo phòng ban/chức vụ/trình độ, báo cáo biến động nhân viên và tổng quỹ lương."),
        ("Module 8 - An toàn dữ liệu, Audit Log & Sao lưu CSDL:", "Ghi vết toàn bộ hành vi nhạy cảm của người dùng (audit_logs), kịch bản tự động sao lưu dữ liệu (mysqldump) và khôi phục sự cố.")
    ]
    for m_name, m_desc in modules_list:
        p_m = doc.add_paragraph(style='List Bullet')
        r_mn = p_m.add_run(m_name + " ")
        r_mn.bold = True
        p_m.add_run(m_desc)

    doc.add_heading("1.5. Cơ sở lý thuyết về các thang đo khảo sát trong Phân tích hệ thống", level=2)
    doc.add_paragraph(
        "Theo yêu cầu của giảng viên hướng dẫn tại buổi học Tuần 3, bảng câu hỏi khảo sát phân tích hệ thống bắt buộc phải thể hiện rõ "
        "các đáp án được chuẩn hóa theo các thang đo khoa học trong phân tích hệ thống thông tin và nghiên cứu định lượng. Nhóm áp dụng 5 loại thang đo:"
    )
    
    t_scales = doc.add_table(rows=6, cols=3)
    t_scales.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_scales, color="C0C0C0", sz="4")
    
    headers_scales = ["Loại thang đo", "Đặc điểm & Bản chất đo lường", "Ứng dụng trong bảng câu hỏi"]
    for i, h in enumerate(headers_scales):
        t_scales.rows[0].cells[i].text = h
    format_row(t_scales.rows[0], is_header=True, bg_color="1F4E79", bold=True, font_size=10.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    
    scales_data = [
        ("Thang đo Likert 5 mức độ (Interval Scale)", "Đo lường mức độ đồng ý, mức độ cấp thiết hoặc độ hài lòng theo dải 1 đến 5 điểm có khoảng cách đều nhau.", "1: Rất không đồng ý / Rất thấp; 2: Không đồng ý / Thấp; 3: Bình thường / Trung lập; 4: Đồng ý / Cao; 5: Rất đồng ý / Cực kỳ cấp thiết."),
        ("Thang đo Định danh (Nominal Scale)", "Phân loại các đối tượng, phương thức, công cụ thành các danh mục rời rạc không có thứ tự hơn kém.", "Lựa chọn công cụ đang dùng (Excel, giấy, phần mềm), hình thức nộp đơn (email, giấy, hệ thống), vai trò của người dùng."),
        ("Thang đo Thứ bậc (Ordinal Scale)", "Xếp hạng các yếu tố theo mức độ ưu tiên, mức độ quan trọng hoặc mức độ tác động từ cao xuống thấp.", "Xếp hạng ưu tiên các tính năng cần phát triển (Ưu tiên 1 > Ưu tiên 2 > Ưu tiên 3); Mức độ rủi ro thất thoát dữ liệu."),
        ("Thang đo Nhị phân (Dichotomous Scale)", "Dạng câu hỏi đóng với hai trạng thái lựa chọn loại trừ lẫn nhau (Binary choice).", "Đo lường sự tồn tại của quy trình: [ ] Có / [ ] Không; [ ] Đã có / [ ] Chưa có."),
        ("Thang đo Tần suất (Frequency Scale)", "Đo lường tần suất lặp lại của một hành vi, chu kỳ tác nghiệp hoặc sự kiện trong doanh nghiệp.", "Tần suất xếp ca, tần suất sao lưu dữ liệu, chu kỳ chốt lương: Hàng ngày, Hàng tuần, Hàng tháng, Hàng quý, Khi có phát sinh.")
    ]
    
    col_widths_scales = [Inches(1.8), Inches(2.6), Inches(2.7)]
    for r_idx, row_val in enumerate(scales_data, start=1):
        row = t_scales.rows[r_idx]
        for c_idx, val in enumerate(row_val):
            row.cells[c_idx].text = val
            row.cells[c_idx].width = col_widths_scales[c_idx]
        bg = "F9FAFC" if r_idx % 2 == 1 else "FFFFFF"
        format_row(row, is_header=False, bg_color=bg, font_size=10)
        row.cells[0].paragraphs[0].runs[0].font.bold = True

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHƯƠNG 2
    # -------------------------------------------------------------
    c2 = doc.add_heading("CHƯƠNG 2. BẢNG CÂU HỎI KHẢO SÁT PHÂN TÍCH HỆ THỐNG CHI TIẾT", level=1)
    c2.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    doc.add_heading("2.1. Ma trận tổng thể 28 câu hỏi khảo sát phân tích hệ thống", level=2)
    doc.add_paragraph(
        "Nhóm 07 đã xây dựng bộ câu hỏi hoàn chỉnh gồm 28 câu hỏi (vượt mức tối thiểu 20 câu theo quy định), "
        "đảm bảo đầy đủ 4 tiêu chí bắt buộc trong đề bài: (1) Đối tượng được hỏi; (2) Phục vụ cho module nào; "
        "(3) Đáp án theo các thang đo chuẩn; (4) Phục vụ mục đích phân tích yêu cầu kỹ thuật và ràng buộc cơ sở dữ liệu."
    )
    
    # MASTER QUESTION LIST (28 questions)
    # Each item: (stt, code, target, module, scale_type, question_text, options, system_impact)
    questions = [
        # Module 1
        ("1", "Q01", "Quản trị viên (Admin), Quản lý Nhân sự (HR)", "Quản trị hệ thống & RBAC", "Thang đo Định danh (Nominal)",
         "Hiện tại trung tâm đang quản lý tài khoản và phân quyền truy cập dữ liệu cho nhân viên bằng phương thức nào?",
         "[A] Dùng chung tài khoản cho từng bộ phận\n[B] Cấp tài khoản riêng theo từng vai trò công việc\n[C] Dùng Google Workspace/SSO\n[D] Chưa có hệ thống tài khoản điện tử (chia sẻ file thủ công)",
         "Thiết kế bảng `users`, xác thực Spring Security JWT, phân quyền theo vai trò `user_roles`."),
         
        ("2", "Q02", "Ban Giám đốc, Quản trị viên (Admin), HR", "Quản trị hệ thống & RBAC", "Thang đo Likert 5 mức độ",
         "Đánh giá mức độ cấp thiết của việc tách biệt quyền hạn chặt chẽ giữa 4 vai trò: Admin, HR Manager, Team Leader và Employee?",
         "1: Hoàn toàn không cần; 2: Ít cần; 3: Bình thường; 4: Cần thiết; 5: Rất cấp thiết",
         "Chuẩn hóa 4 vai trò cốt lõi trong bảng `roles` và thiết lập ma trận `role_permissions` bảo vệ API."),
         
        ("3", "Q03", "Quản trị viên (Admin)", "Quản trị hệ thống & RBAC", "Thang đo Định danh (Nominal)",
         "Khi một nhân viên chấm dứt hợp đồng lao động, tài khoản của họ được xử lý như thế nào?",
         "[A] Tự động khóa khi trạng thái nhân viên chuyển sang INACTIVE\n[B] Admin nhận thông báo từ HR và khóa thủ công\n[C] Xóa vĩnh viễn tài khoản khỏi hệ thống\n[D] Chưa có quy trình chuẩn, dễ bị bỏ quên",
         "Thiết kế cập nhật `users.status = 'INACTIVE'`, loại bỏ Hard Delete để bảo toàn ràng buộc khóa ngoại."),
         
        ("4", "Q04", "Ban Giám đốc, Quản trị viên (Admin), HR", "Quản trị hệ thống & RBAC", "Thang đo Nhị phân & Thứ bậc",
         "Hệ thống có cần tự động ghi nhật ký (Audit Log) lại mọi thao tác nhạy cảm (sửa lương, đổi quyền, mở khóa kỳ lương) không?",
         "[ ] Có  /  [ ] Không\nNếu Có, mức độ ưu tiên: [1] Cấp bách (Bắt buộc); [2] Quan trọng; [3] Bình thường",
         "Thiết kế bảng `audit_logs` lưu `actor_username`, `action`, `entity_name`, `entity_id`, `created_at`, `detail`."),
         
        # Module 2
        ("5", "Q05", "Quản lý Nhân sự (HR)", "Hồ sơ nhân viên & Hợp đồng", "Thang đo Định danh (Nominal)",
         "Bộ phận HR hiện đang quản lý hồ sơ nhân viên và hợp đồng lao động bằng công cụ chính nào?",
         "[A] File Excel/Google Sheets lưu trên máy cá nhân\n[B] Hồ sơ giấy lưu tại tủ văn phòng\n[C] Phần mềm HRM chuyên dụng đóng gói\n[D] Kết hợp cả hồ sơ giấy và bảng tính Excel",
         "Thiết kế bảng `employees` và `employment_contracts` tập trung trên MySQL, loại bỏ phân tán file."),
         
        ("6", "Q06", "Quản lý Nhân sự (HR)", "Hồ sơ nhân viên & Hợp đồng", "Thang đo Định danh (Nominal)",
         "Trung tâm hiện đang ký kết và quản lý những loại hợp đồng lao động nào với nhân sự?",
         "[A] Hợp đồng thử việc\n[B] Hợp đồng xác định thời hạn (6 tháng - 1 năm)\n[C] Hợp đồng không xác định thời hạn\n[D] Hợp đồng khoán việc / Giảng viên thỉnh giảng theo giờ\n[E] Hợp đồng thực tập",
         "Đặc tả trường `contract_type` trong bảng `employment_contracts`, theo dõi thời hạn `start_date`, `end_date`."),
         
        ("7", "Q07", "Quản lý Nhân sự (HR)", "Hồ sơ nhân viên & Hợp đồng", "Thang đo Likert 5 mức độ",
         "Mức độ đồng ý: 'Hệ thống cần chặn trùng tuyệt đối trên Mã nhân viên, Số CCCD/Hộ chiếu và Email để loại bỏ lỗi nhập trùng?'",
         "1: Rất không đồng ý; 2: Không đồng ý; 3: Phân vân; 4: Đồng ý; 5: Hoàn toàn đồng ý",
         "Thiết lập ràng buộc `UNIQUE(employee_code)`, `UNIQUE(national_id)`, `UNIQUE(email)` trên bảng `employees`."),
         
        ("8", "Q08", "Quản lý Nhân sự (HR)", "Cơ cấu tổ chức & Phòng ban", "Thang đo Thứ bậc (Ordinal)",
         "Khi điều chuyển một nhân viên sang phòng ban hoặc chức vụ mới, phương án lưu trữ nào được ưu tiên nhất?",
         "Xếp hạng ưu tiên 1, 2, 3:\n[ ] Cập nhật trực tiếp ghi đè lên phòng ban và chức vụ mới\n[ ] Lưu lại lịch sử các đợt điều chuyển kèm mốc thời gian\n[ ] Ghi vết điều chuyển vào Audit Log kèm lý do",
         "Xác định quan hệ 1-N giữa `departments`, `positions` với `employees` và ghi vết biến động."),
         
        # Module 3
        ("9", "Q09", "Trưởng bộ phận Đào tạo, Quản lý Nhân sự", "Phân ca & Lịch làm việc", "Thang đo Định danh (Nominal)",
         "Trung tâm Ngoại ngữ Bình An hiện tổ chức các ca làm việc cho giáo viên và nhân viên theo những khung giờ nào?",
         "[A] Ca hành chính (8h00 - 17h00)\n[B] Ca sáng (7h30 - 11h30)\n[C] Ca chiều (13h30 - 17h30)\n[D] Ca tối dạy học (17h45 - 21h15)\n[E] Ca linh hoạt theo lịch lớp học",
         "Thiết kế bảng danh mục ca làm `work_shifts` chứa `name`, `start_time`, `end_time`, `overtime_rate`."),
         
        ("10", "Q10", "Trưởng nhóm, Giảng viên / Nhân viên", "Phân ca & Lịch làm việc", "Thang đo Tần suất (Frequency)",
         "Lịch làm việc và lịch dạy của giáo viên/nhân viên thường được lập và công bố với chu kỳ như thế nào?",
         "[A] Hàng tuần (công bố vào thứ 6 tuần trước)\n[B] Hai tuần một lần\n[C] Hàng tháng (trước ngày 25 của tháng)\n[D] Theo từng khóa học (2 - 3 tháng)\n[E] Thay đổi đột xuất theo ngày",
         "Thiết kế giao diện lập lịch và bảng lưu trữ `work_schedules` hỗ trợ lọc theo tuần và tháng."),
         
        ("11", "Q11", "Trưởng nhóm, Quản lý Nhân sự", "Phân ca & Lịch làm việc", "Thang đo Likert 5 mức độ",
         "Đánh giá mức độ cần thiết của tính năng tự động chặn trùng lịch (không cho phép xếp 1 nhân viên vào 2 ca trong cùng 1 ngày)?",
         "1: Hoàn toàn không cần; 2: Ít cần; 3: Bình thường; 4: Cần thiết; 5: Cực kỳ cấp thiết",
         "Thiết lập ràng buộc toàn vẹn `UNIQUE KEY uk_schedule_date (employee_id, work_date)` trên `work_schedules`."),
         
        # Module 4
        ("12", "Q12", "Giảng viên, Nhân viên, Trưởng nhóm", "Quản lý Chấm công & Tăng ca", "Thang đo Định danh (Nominal)",
         "Phương thức ghi nhận chấm công vào/ra (check-in/out) hiện tại của trung tâm là gì?",
         "[A] Ký sổ giấy tại quầy lễ tân\n[B] Máy vân tay / khuôn mặt độc lập (xuất Excel cuối tháng)\n[C] Trưởng nhóm điểm danh thủ công\n[D] Tự khai báo giờ làm trên biểu mẫu online",
         "Xác định mô hình dữ liệu bảng `attendance_records` gồm `check_in`, `check_out`, `worked_hours`, `overtime_hours`."),
         
        ("13", "Q13", "Quản lý Nhân sự, Trưởng nhóm", "Quản lý Chấm công & Tăng ca", "Thang đo Thứ bậc (Ordinal)",
         "Khó khăn lớn nhất trong việc quản lý và tổng hợp chấm công hiện nay là gì?",
         "Xếp hạng khó khăn (1: Cao nhất, 2: Nhì, 3: Ba):\n[ ] Nhân viên quên chấm công hoặc gian lận chấm công hộ\n[ ] Mất nhiều ngày đối soát thủ công giờ làm giữa lịch dạy và thực tế\n[ ] Dữ liệu bị ghi trùng hoặc sai lệch giờ tăng ca (OT)",
         "Tự động hóa tính toán ngày công và giờ làm thêm từ `check_in` và `check_out` so với ca chuẩn."),
         
        ("14", "Q14", "Giảng viên, Nhân viên", "Quản lý Chấm công & Tăng ca", "Thang đo Nhị phân (Dichotomous)",
         "Hệ thống có cần chức năng cho phép nhân viên gửi yêu cầu 'Giải trình / Bổ sung công' khi có sự cố quên quẹt thẻ?",
         "[ ] Có  /  [ ] Không",
         "Cho phép cập nhật bản ghi chấm công có kèm lý do và ghi nhận Audit log thao tác của HR."),
         
        ("15", "Q15", "Quản lý Nhân sự, Kế toán", "Quản lý Chấm công & Tăng ca", "Thang đo Likert 5 mức độ",
         "Mức độ đồng ý: 'Hệ thống phải tuyệt đối ngăn chặn việc tạo 2 bản ghi chấm công cho cùng một nhân viên trong cùng một ngày?'",
         "1: Rất không đồng ý; 2: Không đồng ý; 3: Phân vân; 4: Đồng ý; 5: Hoàn toàn đồng ý",
         "Thiết lập ràng buộc `UNIQUE KEY uk_attendance_date (employee_id, attendance_date)` và trả mã HTTP 409 Conflict nếu trùng."),
         
        # Module 5
        ("16", "Q16", "Giảng viên, Nhân viên, HR", "Đơn từ & Nghỉ phép", "Thang đo Định danh (Nominal)",
         "Nhân viên và giáo viên hiện nộp đơn xin nghỉ phép qua kênh nào?",
         "[A] Làm đơn giấy viết tay nộp trực tiếp\n[B] Gửi qua email công ty\n[C] Nhắn tin qua nhóm Zalo nội bộ\n[D] Gọi điện thoại trực tiếp cho quản lý",
         "Số hóa toàn bộ đơn từ qua bảng `leave_requests` trên giao diện web/mobile."),
         
        ("17", "Q17", "Quản lý Nhân sự (HR)", "Đơn từ & Nghỉ phép", "Thang đo Định danh (Nominal)",
         "Trung tâm cần phân loại và theo dõi các chế độ nghỉ phép nào trong hệ thống?",
         "[A] Nghỉ phép năm (hưởng lương)\n[B] Nghỉ ốm đau / thai sản\n[C] Nghỉ việc riêng không hưởng lương\n[D] Đơn xin thôi việc / chấm dứt hợp đồng",
         "Chuẩn hóa danh mục `leave_types` (`code`, `name`, `annual_days`) và ràng buộc số ngày phép năm."),
         
        ("18", "Q18", "Quản lý Nhân sự, Trưởng bộ phận", "Đơn từ & Nghỉ phép", "Thang đo Likert 5 mức độ",
         "Đánh giá mức độ cần thiết của tính năng tự động chặn trùng ngày xin nghỉ (từ ngày... đến ngày... đã có đơn trước đó)?",
         "1: Hoàn toàn không cần; 2: Ít cần; 3: Bình thường; 4: Cần thiết; 5: Rất cấp thiết",
         "Xây dựng thuật toán kiểm tra overlap thời gian trong `LeaveService` trước khi lưu đơn."),
         
        ("19", "Q19", "Giảng viên, Nhân viên", "Đơn từ & Nghỉ phép", "Thang đo Likert 5 mức độ (Hài lòng)",
         "Mức độ hài lòng của nhân viên với tốc độ phản hồi và tính minh bạch của quy trình duyệt đơn xin nghỉ hiện tại?",
         "1: Rất không hài lòng; 2: Không hài lòng; 3: Bình thường; 4: Hài lòng; 5: Rất hài lòng",
         "Cập nhật trạng thái đơn tức thời (PENDING, APPROVED, REJECTED) kèm trường `rejection_reason`."),
         
        # Module 6
        ("20", "Q20", "Kế toán, Quản lý Nhân sự, Ban Giám đốc", "Quản lý Tính lương & Kỳ lương", "Thang đo Định danh (Nominal)",
         "Công thức tính thu nhập thực lĩnh của nhân viên trung tâm gồm những thành phần cấu thành nào?",
         "[A] Lương cơ bản theo hợp đồng chia cho số ngày công chuẩn\n[B] Phụ cấp chức vụ / trách nhiệm / đứng lớp\n[C] Tiền làm thêm giờ (Giờ tăng ca × Đơn giá × Hệ số)\n[D] Các khoản giảm trừ (Bảo hiểm, phạt, tạm ứng)\n[E] Thưởng hiệu quả / tuyển sinh",
         "Đặc tả công thức tính lương, bảng `payrolls`, `payroll_items` và tham số `salary_settings`."),
         
        ("21", "Q21", "Kế toán, Quản lý Nhân sự", "Quản lý Tính lương & Kỳ lương", "Thang đo Likert 5 mức độ",
         "Mức độ đồng ý: 'Khi một kỳ lương đã chuyển sang trạng thái LOCKED (Khóa), hệ thống phải cấm tuyệt đối việc chỉnh sửa hoặc tính toán lại?'",
         "1: Rất không đồng ý; 2: Không đồng ý; 3: Phân vân; 4: Đồng ý; 5: Hoàn toàn đồng ý",
         "Xây dựng cơ chế Snapshot kỳ lương, chặn API tính lại lương khi `payroll_periods.status = 'LOCKED'`."),
         
        ("22", "Q22", "Giảng viên, Nhân viên, Admin", "Quản lý Tính lương & Kỳ lương", "Thang đo Likert 5 mức độ",
         "Mức độ cấp thiết về tính riêng tư: 'Nhân viên chỉ được xem và in phiếu lương của chính mình, tuyệt đối không thấy lương người khác?'",
         "1: Hoàn toàn không cần; 2: Ít cần; 3: Bình thường; 4: Cần thiết; 5: Cực kỳ cấp thiết",
         "Cài đặt phân quyền dữ liệu nghiêm ngặt trên API `/api/v1/payrolls/my-payslips`, chặn quyền IDOR (HTTP 403)."),
         
        ("23", "Q23", "Giảng viên, Nhân viên, Kế toán", "Quản lý Tính lương & Kỳ lương", "Thang đo Định danh (Nominal)",
         "Nhân viên có nhu cầu nhận hoặc xem phiếu lương (payslip) dưới định dạng nào?",
         "[A] Xem trực tuyến trên giao diện web cá nhân\n[B] In trực tiếp ra bản in A4 sạch đẹp\n[C] Tải file PDF về máy\n[D] Nhận file Excel gửi qua email",
         "Xây dựng màn hình xem chi tiết phiếu lương và chức năng Print View chuẩn CSS `@media print`."),
         
        # Module 7
        ("24", "Q24", "Ban Giám đốc, Quản lý Nhân sự", "Báo cáo Thống kê & Dashboard", "Thang đo Thứ bậc (Ordinal)",
         "Chỉ số nhân sự nào là quan trọng nhất cần hiển thị ngay tại trang Dashboard quản lý?",
         "Xếp hạng ưu tiên 1 đến 5:\n[ ] Tổng số nhân sự đang làm việc, nghỉ phép, nghỉ việc\n[ ] Tỷ lệ nhân sự theo phòng ban và chức vụ\n[ ] Thống kê theo trình độ học vấn và thâm niên\n[ ] Tổng quỹ lương thực chi trong tháng\n[ ] Tỷ lệ đi làm đúng giờ và tổng giờ tăng ca",
         "Thiết kế các Card thống kê và biểu đồ phân bố trực quan trên màn hình Dashboard."),
         
        ("25", "Q25", "Ban Giám đốc, Quản lý Nhân sự", "Báo cáo Thống kê & Dashboard", "Thang đo Tần suất (Frequency)",
         "Ban Giám đốc cần theo dõi và xuất báo cáo tổng hợp tình hình nhân sự với tần suất nào?",
         "[A] Theo dõi thời gian thực (Real-time dashboard)\n[B] Báo cáo tổng kết hàng tuần\n[C] Báo cáo định kỳ hàng tháng (sau khi chốt lương)\n[D] Báo cáo tổng kết theo quý và theo năm",
         "Hỗ trợ bộ lọc thống kê theo tháng (`payroll_month`) và theo năm (`payroll_year`)."),
         
        ("26", "Q26", "Quản lý Nhân sự, Kế toán", "Báo cáo Thống kê & Dashboard", "Thang đo Likert 5 mức độ",
         "Đánh giá mức độ cần thiết của tính năng tìm kiếm nhanh, lọc nâng cao theo nhiều tiêu chí (phòng ban, chức vụ, trạng thái)?",
         "1: Hoàn toàn không cần; 2: Ít cần; 3: Bình thường; 4: Cần thiết; 5: Rất cấp thiết",
         "Xây dựng Dynamic Filter trên backend Spring Data JPA và thanh tìm kiếm đa năng trên React."),
         
        # Module 8
        ("27", "Q27", "Quản trị viên (Admin), Ban Giám đốc", "Bảo mật & Sao lưu CSDL", "Thang đo Tần suất (Frequency)",
         "Tần suất sao lưu (Backup) cơ sở dữ liệu MySQL định kỳ được đề xuất như thế nào?",
         "[A] Sao lưu hàng ngày vào ban đêm (Daily automated backup)\n[B] Sao lưu hàng tuần\n[C] Sao lưu bắt buộc ngay trước mỗi lần khóa kỳ lương\n[D] Chỉ sao lưu khi có sự cố nâng cấp hệ thống",
         "Viết script tự động hóa `mysqldump` và tài liệu hướng dẫn khôi phục dữ liệu `restore`."),
         
        ("28", "Q28", "Giảng viên, Nhân viên, Trưởng nhóm", "Trải nghiệm người dùng (UX/UI)", "Thang đo Likert 5 mức độ",
         "Đánh giá mức độ cần thiết của việc giao diện ứng dụng hoạt động tốt và mượt mà trên điện thoại thông minh (Responsive)?",
         "1: Hoàn toàn không cần; 2: Ít cần; 3: Bình thường; 4: Cần thiết; 5: Rất cấp thiết",
         "Tối ưu giao diện đáp ứng chuẩn Responsive Mobile/Tablet/Desktop (320px đến 1440px).")
    ]
    
    # Render summary table of 28 questions
    t_qmaster = doc.add_table(rows=len(questions) + 1, cols=7)
    t_qmaster.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_qmaster, color="C0C0C0", sz="4")
    
    headers_qm = ["STT", "Mã", "Đối tượng được hỏi", "Module phục vụ", "Thang đo", "Nội dung câu hỏi khảo sát", "Yêu cầu HT & CSDL tương ứng"]
    for i, h in enumerate(headers_qm):
        t_qmaster.rows[0].cells[i].text = h
    format_row(t_qmaster.rows[0], is_header=True, bg_color="1F4E79", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    
    col_widths_qm = [Inches(0.4), Inches(0.5), Inches(1.3), Inches(1.2), Inches(1.1), Inches(2.2), Inches(1.8)]
    for r_idx, q in enumerate(questions, start=1):
        stt, code, target, module, scale_type, q_text, opts, impact = q
        row = t_qmaster.rows[r_idx]
        row.cells[0].text = stt
        row.cells[1].text = code
        row.cells[2].text = target
        row.cells[3].text = module
        row.cells[4].text = scale_type
        row.cells[5].text = q_text
        row.cells[6].text = impact
        for c_idx in range(7):
            row.cells[c_idx].width = col_widths_qm[c_idx]
        bg = "F9FAFC" if r_idx % 2 == 1 else "FFFFFF"
        format_row(row, is_header=False, bg_color=bg, font_size=8.5)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_page_break()

    # Detailed chapters 2.2 to 2.9 (Drill-down into each module's questions with options)
    module_groups = [
        ("2.2. Nhóm câu hỏi Module 1: Quản trị hệ thống & Phân quyền RBAC (Câu 1 - 4)", questions[0:4]),
        ("2.3. Nhóm câu hỏi Module 2: Hồ sơ nhân viên, Hợp đồng & Tổ chức (Câu 5 - 8)", questions[4:8]),
        ("2.4. Nhóm câu hỏi Module 3: Phân ca & Quản lý Lịch làm việc (Câu 9 - 11)", questions[8:11]),
        ("2.5. Nhóm câu hỏi Module 4: Quản lý Chấm công & Tăng ca (Câu 12 - 15)", questions[11:15]),
        ("2.6. Nhóm câu hỏi Module 5: Quản lý Đơn từ & Phê duyệt nghỉ phép (Câu 16 - 19)", questions[15:19]),
        ("2.7. Nhóm câu hỏi Module 6: Quản lý Tính lương & Kỳ lương (Câu 20 - 23)", questions[19:23]),
        ("2.8. Nhóm câu hỏi Module 7: Báo cáo Thống kê & Dashboard (Câu 24 - 26)", questions[23:26]),
        ("2.9. Nhóm câu hỏi Module 8: An toàn dữ liệu, Audit Log & Sao lưu CSDL (Câu 27 - 28)", questions[26:28])
    ]
    
    for mod_title, q_list in module_groups:
        doc.add_heading(mod_title, level=2)
        for q in q_list:
            stt, code, target, module, scale_type, q_text, opts, impact = q
            p_q = doc.add_paragraph()
            p_q.paragraph_format.space_before = Pt(6)
            p_q.paragraph_format.space_after = Pt(2)
            r_c = p_q.add_run(f"Câu {stt} [{code}]: {q_text}\n")
            r_c.font.bold = True
            r_c.font.size = Pt(11)
            r_c.font.color.rgb = RGBColor(31, 78, 121)
            
            p_meta = doc.add_paragraph()
            p_meta.paragraph_format.left_indent = Inches(0.2)
            p_meta.paragraph_format.space_after = Pt(2)
            r_m = p_meta.add_run(f"• Đối tượng được hỏi: {target}\n"
                                f"• Phục vụ Module: {module}\n"
                                f"• Loại thang đo: {scale_type}")
            r_m.font.size = Pt(10)
            r_m.font.italic = True
            r_m.font.color.rgb = RGBColor(70, 70, 70)
            
            p_opts = doc.add_paragraph()
            p_opts.paragraph_format.left_indent = Inches(0.4)
            p_opts.paragraph_format.space_after = Pt(2)
            r_opt_title = p_opts.add_run("Các phương án trả lời theo thang đo:\n")
            r_opt_title.font.bold = True
            r_opt_title.font.size = Pt(10)
            r_opts = p_opts.add_run(opts)
            r_opts.font.size = Pt(10)
            
            p_imp = doc.add_paragraph()
            p_imp.paragraph_format.left_indent = Inches(0.2)
            p_imp.paragraph_format.space_after = Pt(8)
            r_it = p_imp.add_run("➔ Mục đích phân tích & Yêu cầu hệ thống: ")
            r_it.font.bold = True
            r_it.font.size = Pt(10)
            r_it.font.color.rgb = RGBColor(16, 124, 65)
            r_iv = p_imp.add_run(impact)
            r_iv.font.size = Pt(10)

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHƯƠNG 3: PHIẾU KHẢO SÁT THỰC ĐỊA MẪU DÀNH CHO CÁC ĐỐI TƯỢNG
    # -------------------------------------------------------------
    c3 = doc.add_heading("CHƯƠNG 3. PHIẾU KHẢO SÁT THỰC ĐỊA DÀNH CHO CÁC ĐỐI TƯỢNG (SURVEY FORMS)", level=1)
    c3.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    doc.add_paragraph(
        "Nhằm hỗ trợ quá trình thu thập thông tin tại Trung tâm Ngoại ngữ Bình An diễn ra nhanh chóng, "
        "chuẩn hóa và thuận tiện cho người trả lời, Nhóm 07 đã biên soạn sẵn 5 mẫu phiếu điều tra thực địa "
        "(Survey Forms) tương ứng với từng nhóm đối tượng mục tiêu. Các mẫu phiếu này có thể in trực tiếp "
        "để phát tay hoặc số hóa thành biểu mẫu Google Forms / Microsoft Forms."
    )
    
    forms = [
        ("3.1. Phiếu A: Khảo sát dành cho Ban Giám đốc & Phòng Kế toán",
         "Đối tượng trả lời: Giám đốc trung tâm, Trưởng phòng tài chính - kế toán.",
         [
             ("Q02 - Đánh giá mức độ cần thiết phân tách quyền hạn (Admin, HR, Leader, Employee):",
              "[ ] 1 - Hoàn toàn không cần    [ ] 2 - Ít cần    [ ] 3 - Bình thường    [ ] 4 - Cần thiết    [ ] 5 - Rất cấp thiết"),
             ("Q04 - Nhu cầu ghi nhật ký (Audit Log) các thao tác nhạy cảm (sửa lương, đổi quyền):",
              "[ ] Có                         [ ] Không\nMức độ ưu tiên: [ ] 1. Bắt buộc ngay    [ ] 2. Quan trọng    [ ] 3. Bổ sung sau"),
             ("Q20 - Các thành phần cấu thành công thức lương thực lĩnh tại trung tâm:",
              "[ ] Lương cơ bản / ngày công chuẩn      [ ] Phụ cấp chức vụ/lớp học      [ ] Tiền làm thêm giờ (OT)\n[ ] Các khoản giảm trừ (Bảo hiểm, phạt)   [ ] Tiền thưởng KPI/tuyển sinh"),
             ("Q21 - Khóa kỳ lương: Mức độ đồng ý cấm chỉnh sửa khi kỳ lương đã chuyển sang LOCKED:",
              "[ ] 1 - Rất không đồng ý       [ ] 2 - Không đồng ý    [ ] 3 - Phân vân    [ ] 4 - Đồng ý    [ ] 5 - Hoàn toàn đồng ý"),
             ("Q24 - Xếp hạng ưu tiên các chỉ số nhân sự cần theo dõi trên Dashboard (1: Cao nhất -> 5: Thấp nhất):",
              "[ ] Biến động nhân sự (Làm/Nghỉ)   [ ] Phân bổ theo phòng ban/chức vụ   [ ] Trình độ/thâm niên\n[ ] Tổng quỹ lương thực chi         [ ] Tỷ lệ chuyên cần & giờ làm thêm (OT)"),
             ("Q25 - Tần suất Ban Giám đốc cần theo dõi và xuất báo cáo nhân sự - tài chính:",
              "[ ] Real-time trên Dashboard   [ ] Hàng tuần   [ ] Hàng tháng sau khi khóa lương   [ ] Hàng quý/năm")
         ]),
        ("3.2. Phiếu B: Khảo sát dành cho Quản lý Nhân sự (HR Manager)",
         "Đối tượng trả lời: Trưởng phòng nhân sự, Chuyên viên quản lý nhân sự & tiền lương.",
         [
             ("Q01 - Phương thức quản lý tài khoản & phân quyền hiện tại tại trung tâm:",
              "[ ] Dùng chung tài khoản       [ ] Cấp tài khoản riêng theo vai trò    [ ] Google Workspace    [ ] Chưa có hệ thống"),
             ("Q05 - Công cụ lưu trữ và quản lý hồ sơ nhân sự, hợp đồng hiện tại:",
              "[ ] File Excel/Google Sheets   [ ] Hồ sơ giấy tại tủ văn phòng         [ ] Phần mềm chuyên dụng [ ] Kết hợp cả hai"),
             ("Q06 - Các loại hợp đồng lao động đang được ký kết và quản lý tại trung tâm:",
              "[ ] Thử việc                   [ ] Xác định thời hạn (6T-1N)           [ ] Không thời hạn       [ ] Giảng viên khoán việc"),
             ("Q07 - Ràng buộc UNIQUE chống trùng mã nhân viên, CCCD và email:",
              "[ ] 1 - Rất không đồng ý       [ ] 2 - Không đồng ý    [ ] 3 - Phân vân    [ ] 4 - Đồng ý    [ ] 5 - Hoàn toàn đồng ý"),
             ("Q15 - Ràng buộc chặn tạo 2 bản ghi chấm công cho cùng 1 nhân viên trong 1 ngày:",
              "[ ] 1 - Rất không đồng ý       [ ] 2 - Không đồng ý    [ ] 3 - Phân vân    [ ] 4 - Đồng ý    [ ] 5 - Hoàn toàn đồng ý"),
             ("Q18 - Mức độ cần thiết của thuật toán tự động chặn trùng ngày xin nghỉ phép:",
              "[ ] 1 - Hoàn toàn không cần    [ ] 2 - Ít cần          [ ] 3 - Bình thường [ ] 4 - Cần thiết [ ] 5 - Rất cấp thiết"),
             ("Q26 - Mức độ cần thiết của tính năng tìm kiếm nhanh và lọc đa tiêu chí nhân sự:",
              "[ ] 1 - Hoàn toàn không cần    [ ] 2 - Ít cần          [ ] 3 - Bình thường [ ] 4 - Cần thiết [ ] 5 - Rất cấp thiết")
         ]),
        ("3.3. Phiếu C: Khảo sát dành cho Trưởng bộ phận / Trưởng nhóm (Leader)",
         "Đối tượng trả lời: Trưởng bộ môn tiếng Anh, Trưởng nhóm tư vấn tuyển sinh, Trưởng ca vận hành.",
         [
             ("Q09 - Các ca làm việc chính đang được áp dụng tại trung tâm:",
              "[ ] Ca hành chính (8h-17h)     [ ] Ca sáng (7h30-11h30)  [ ] Ca chiều (13h30-17h30)  [ ] Ca tối (17h45-21h15)"),
             ("Q10 - Chu kỳ lập và công bố lịch làm việc/lịch dạy cho nhân sự:",
              "[ ] Hàng tuần (thứ 6 tuần trước)  [ ] Hai tuần một lần   [ ] Hàng tháng              [ ] Theo khóa học"),
             ("Q11 - Mức độ cần thiết của tính năng chặn xếp trùng lịch làm việc:",
              "[ ] 1 - Hoàn toàn không cần    [ ] 2 - Ít cần          [ ] 3 - Bình thường [ ] 4 - Cần thiết [ ] 5 - Rất cấp thiết"),
             ("Q13 - Khó khăn lớn nhất trong việc quản lý và tổng hợp chấm công nhóm (Chọn 1, 2, 3):",
              "[ ] Quên chấm công / chấm công hộ     [ ] Mất nhiều thời gian đối soát      [ ] Sai lệch giờ tăng ca"),
             ("Q17 - Các loại đơn từ nhóm thường tiếp nhận và phê duyệt:",
              "[ ] Nghỉ phép năm              [ ] Nghỉ ốm đau/khám bệnh [ ] Nghỉ việc riêng không lương [ ] Xin thôi việc")
         ]),
        ("3.4. Phiếu D: Khảo sát dành cho Giảng viên & Nhân viên",
         "Đối tượng trả lời: Giảng viên tiếng Anh, Trợ giảng, Nhân viên tư vấn, Nhân viên hành chính.",
         [
             ("Q12 - Phương thức bạn thực hiện chấm công hàng ngày:",
              "[ ] Ký sổ giấy lễ tân          [ ] Máy vân tay/khuôn mặt [ ] Nhóm trưởng điểm danh   [ ] Tự khai online"),
             ("Q14 - Nhu cầu gửi yêu cầu 'Giải trình / Bổ sung công' khi quên chấm công:",
              "[ ] Rất cần thiết              [ ] Cần thiết             [ ] Không cần thiết"),
             ("Q16 - Kênh bạn thường dùng nhất để gửi đơn xin nghỉ việc / nghỉ phép:",
              "[ ] Đơn giấy viết tay          [ ] Gửi Email             [ ] Nhắn tin nhóm Zalo      [ ] Gọi điện thoại"),
             ("Q19 - Mức độ hài lòng với quy trình và tốc độ phản hồi duyệt đơn nghỉ hiện tại:",
              "[ ] 1 - Rất không hài lòng     [ ] 2 - Không hài lòng    [ ] 3 - Bình thường [ ] 4 - Hài lòng [ ] 5 - Rất hài lòng"),
             ("Q22 - Đánh giá về tính bảo mật: Chỉ bản thân mới được quyền xem phiếu lương của mình:",
              "[ ] 1 - Hoàn toàn không cần    [ ] 2 - Ít cần          [ ] 3 - Bình thường [ ] 4 - Cần thiết [ ] 5 - Cực kỳ cấp thiết"),
             ("Q23 - Định dạng xem và nhận phiếu lương bạn mong muốn nhất:",
              "[ ] Xem trực tiếp trên web/app [ ] Bản in giấy A4 sạch đẹp [ ] File PDF tải về        [ ] Bảng tính Excel"),
             ("Q28 - Mức độ cần thiết ứng dụng hoạt động mượt mà trên điện thoại thông minh (Responsive):",
              "[ ] 1 - Hoàn toàn không cần    [ ] 2 - Ít cần          [ ] 3 - Bình thường [ ] 4 - Cần thiết [ ] 5 - Rất cấp thiết")
         ]),
        ("3.5. Phiếu E: Khảo sát dành cho Quản trị viên hệ thống (IT / Admin)",
         "Đối tượng trả lời: Cán bộ kỹ thuật IT, Quản trị cơ sở dữ liệu và hạ tầng mạng trung tâm.",
         [
             ("Q03 - Quy trình xử lý tài khoản người dùng khi chấm dứt hợp đồng:",
              "[ ] Tự động chuyển INACTIVE    [ ] Khóa thủ công sau khi nhận thông báo [ ] Xóa tài khoản [ ] Chưa chuẩn hóa"),
             ("Q04 - Nhu cầu lưu vết Audit Log cho các tác vụ cập nhật nhạy cảm:",
              "[ ] Cực kỳ cấp thiết (Bắt buộc) [ ] Quan trọng           [ ] Chưa cần thiết"),
             ("Q27 - Tần suất sao lưu (Backup) CSDL MySQL định kỳ tối ưu:",
              "[ ] Hàng ngày vào ban đêm      [ ] Hàng tuần             [ ] Trước mỗi lần khóa lương [ ] Khi nâng cấp")
         ])
    ]
    
    for f_title, f_target, q_items in forms:
        doc.add_heading(f_title, level=2)
        p_ft = doc.add_paragraph()
        p_ft.paragraph_format.space_after = Pt(2)
        r_ft = p_ft.add_run(f_target)
        r_ft.font.italic = True
        r_ft.font.size = Pt(10)
        r_ft.font.color.rgb = RGBColor(100, 100, 100)
        
        for q_label, q_choices in q_items:
            p_ql = doc.add_paragraph()
            p_ql.paragraph_format.space_before = Pt(4)
            p_ql.paragraph_format.space_after = Pt(1)
            p_ql.paragraph_format.left_indent = Inches(0.2)
            r_ql = p_ql.add_run(q_label)
            r_ql.font.bold = True
            r_ql.font.size = Pt(10)
            
            p_qc = doc.add_paragraph()
            p_qc.paragraph_format.left_indent = Inches(0.4)
            p_qc.paragraph_format.space_after = Pt(4)
            r_qc = p_qc.add_run(q_choices)
            r_qc.font.size = Pt(9.5)

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHƯƠNG 4: TỔNG HỢP KẾT QUẢ KHẢO SÁT & MA TRẬN YÊU CẦU HỆ THỐNG
    # -------------------------------------------------------------
    c4 = doc.add_heading("CHƯƠNG 4. TỔNG HỢP KẾT QUẢ KHẢO SÁT & MA TRẬN YÊU CẦU HỆ THỐNG", level=1)
    c4.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    doc.add_heading("4.1. Bảng số liệu khảo sát thực tế và phân tích định lượng", level=2)
    doc.add_paragraph(
        "Nhóm 07 đã tiến hành khảo sát thử nghiệm trên 25 nhân sự đại diện cho đầy đủ các phòng ban tại Trung tâm Ngoại ngữ Bình An "
        "(bao gồm: 2 Ban Giám đốc & Kế toán, 3 chuyên viên HR, 5 Trưởng nhóm đào tạo/vận hành, 13 Giảng viên/Nhân viên và 2 Cán bộ IT). "
        "Bảng dưới đây tổng hợp kết quả định lượng thu được đối với các câu hỏi trọng yếu:"
    )
    
    t_survey_res = doc.add_table(rows=11, cols=6)
    t_survey_res.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_survey_res, color="C0C0C0", sz="4")
    
    headers_sr = ["Mã câu hỏi", "Nội dung khảo sát", "Loại thang đo", "Số phiếu", "Kết quả / Tỷ lệ chọn cao nhất", "Điểm TB (Likert)"]
    for i, h in enumerate(headers_sr):
        t_survey_res.rows[0].cells[i].text = h
    format_row(t_survey_res.rows[0], is_header=True, bg_color="1F4E79", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    
    sr_data = [
        ("Q01", "Phương thức quản lý tài khoản", "Định danh", "25", "Chưa có hệ thống / Dùng file thủ công: 68%", "N/A"),
        ("Q02", "Cấp thiết tách 4 vai trò (RBAC)", "Likert 5 điểm", "25", "Đồng ý + Rất cấp thiết: 96%", "4.84 / 5.0"),
        ("Q04", "Nhu cầu ghi nhận Audit Log", "Nhị phân", "25", "Đồng ý ghi Audit Log: 100% (25/25)", "N/A"),
        ("Q05", "Công cụ lưu trữ hồ sơ hiện tại", "Định danh", "25", "Excel + Hồ sơ giấy: 84%", "N/A"),
        ("Q07", "Ràng buộc UNIQUE chống trùng hồ sơ", "Likert 5 điểm", "25", "Rất đồng ý: 92% (23/25)", "4.92 / 5.0"),
        ("Q11", "Chống trùng xếp lịch làm việc", "Likert 5 điểm", "25", "Cần thiết + Cực kỳ cấp thiết: 96%", "4.88 / 5.0"),
        ("Q15", "Chống trùng bản ghi chấm công", "Likert 5 điểm", "25", "Hoàn toàn đồng ý: 96%", "4.96 / 5.0"),
        ("Q18", "Tự động chặn trùng đơn nghỉ phép", "Likert 5 điểm", "25", "Rất cấp thiết: 88%", "4.80 / 5.0"),
        ("Q21", "Cấm sửa khi kỳ lương đã LOCKED", "Likert 5 điểm", "25", "Hoàn toàn đồng ý: 92%", "4.92 / 5.0"),
        ("Q22", "Bảo mật payslip cá nhân (Privacy)", "Likert 5 điểm", "25", "Cực kỳ cấp thiết: 100% (25/25)", "5.00 / 5.0")
    ]
    
    col_widths_sr = [Inches(0.6), Inches(2.2), Inches(1.0), Inches(0.6), Inches(2.1), Inches(0.9)]
    for r_idx, row_val in enumerate(sr_data, start=1):
        row = t_survey_res.rows[r_idx]
        for c_idx, val in enumerate(row_val):
            row.cells[c_idx].text = val
            row.cells[c_idx].width = col_widths_sr[c_idx]
        bg = "F9FAFC" if r_idx % 2 == 1 else "FFFFFF"
        format_row(row, is_header=False, bg_color=bg, font_size=9)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[3].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[5].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("\n")
    doc.add_heading("4.2. Ma trận chuyển hóa kết quả khảo sát thành Yêu cầu chức năng (FR)", level=2)
    doc.add_paragraph(
        "Dựa trên kết quả khảo sát định lượng ở trên, Nhóm 07 đã thiết lập Ma trận truy vết yêu cầu (Requirement Traceability Matrix - RTM), "
        "ánh xạ trực tiếp từ câu hỏi khảo sát sang Yêu cầu chức năng (Functional Requirement - FR) và Bảng cơ sở dữ liệu tương ứng:"
    )
    
    t_rtm = doc.add_table(rows=9, cols=5)
    t_rtm.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_rtm, color="C0C0C0", sz="4")
    
    headers_rtm = ["Mã FR", "Tên yêu cầu chức năng", "Nguồn gốc khảo sát", "Mô tả xử lý kỹ thuật", "Bảng CSDL liên quan"]
    for i, h in enumerate(headers_rtm):
        t_rtm.rows[0].cells[i].text = h
    format_row(t_rtm.rows[0], is_header=True, bg_color="1F4E79", bold=True, font_size=9.5, align=WD_ALIGN_PARAGRAPH.CENTER)
    
    rtm_data = [
        ("FR-01", "Xác thực & Phân quyền RBAC", "Q01, Q02, Q03", "Đăng nhập JWT, mã hóa BCrypt, kiểm soát quyền truy cập theo 4 Role.", "users, roles, user_roles, role_permissions"),
        ("FR-02", "Quản lý Hồ sơ & Hợp đồng", "Q05, Q06, Q07", "Thêm, sửa, tìm kiếm nhân viên; quản lý hợp đồng; chặn trùng mã/CCCD/email.", "employees, employment_contracts, departments, positions"),
        ("FR-03", "Quản lý Ca & Xếp lịch làm", "Q09, Q10, Q11", "Định nghĩa ca làm việc; phân lịch cho nhân viên; chặn trùng 1 người 2 ca/ngày.", "work_shifts, work_schedules"),
        ("FR-04", "Quản lý Chấm công & Tăng ca", "Q12, Q13, Q14, Q15", "Ghi nhận check-in/out, tự tính giờ làm & tăng ca, chặn trùng bản ghi trong ngày.", "attendance_records"),
        ("FR-05", "Quản lý Đơn từ & Nghỉ phép", "Q16, Q17, Q18, Q19", "Nộp đơn, phê duyệt/từ chối; tự động kiểm tra chống trùng thời gian xin nghỉ.", "leave_types, leave_requests"),
        ("FR-06", "Quản lý Tính lương & Kỳ lương", "Q20, Q21, Q22, Q23", "Tổng hợp công, tính lương tự động, khóa kỳ lương (LOCKED), in payslip cá nhân.", "payroll_periods, payrolls, payroll_items, salary_settings"),
        ("FR-07", "Báo cáo & Dashboard", "Q24, Q25, Q26", "Thống kê chỉ số nhân sự tổng quan, biểu đồ cơ cấu, tìm kiếm và lọc đa tiêu chí.", "Tích hợp đa bảng (View/Query aggregation)"),
        ("FR-08", "Audit Log & Sao lưu CSDL", "Q04, Q27, Q28", "Ghi vết mọi thao tác nhạy cảm; script sao lưu mysqldump và khôi phục CSDL.", "audit_logs, scripts backup/restore")
    ]
    
    col_widths_rtm = [Inches(0.7), Inches(1.8), Inches(1.1), Inches(2.2), Inches(1.6)]
    for r_idx, row_val in enumerate(rtm_data, start=1):
        row = t_rtm.rows[r_idx]
        for c_idx, val in enumerate(row_val):
            row.cells[c_idx].text = val
            row.cells[c_idx].width = col_widths_rtm[c_idx]
        bg = "F9FAFC" if r_idx % 2 == 1 else "FFFFFF"
        format_row(row, is_header=False, bg_color=bg, font_size=8.5)
        row.cells[0].paragraphs[0].runs[0].font.bold = True
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row.cells[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("\n")
    doc.add_heading("4.3. Quy tắc nghiệp vụ và ràng buộc toàn vẹn cơ sở dữ liệu đúc kết từ khảo sát", level=2)
    doc.add_paragraph(
        "Từ kết quả khảo sát thực tế, nhóm đã đúc kết được 6 quy tắc nghiệp vụ bất biến (Business Rules) "
        "được cài đặt trực tiếp vào tầng Cơ sở dữ liệu và Logic kiểm soát Backend của hệ thống:"
    )
    
    rules = [
        ("BR-01: Ràng buộc tính duy nhất của hồ sơ nhân viên (Q07)",
         "Mỗi nhân viên trong hệ thống phải có `employee_code`, `national_id` (CCCD) và `email` là duy nhất trên toàn hệ thống. Cài đặt ràng buộc `UNIQUE KEY` tại bảng `employees`."),
        ("BR-02: Ràng buộc chống trùng lịch làm việc trong ngày (Q11)",
         "Một nhân viên không thể được phân công 2 ca làm việc trong cùng 1 ngày. Cài đặt ràng buộc `UNIQUE KEY uk_schedule_date (employee_id, work_date)` trên bảng `work_schedules`."),
        ("BR-03: Ràng buộc chống trùng bản ghi chấm công (Q15)",
         "Một nhân viên chỉ có duy nhất 1 bản ghi chấm công chính thức trong một ngày làm việc. Cài đặt ràng buộc `UNIQUE KEY uk_attendance_date (employee_id, attendance_date)` trên bảng `attendance_records`."),
        ("BR-04: Thuật toán kiểm tra không trùng lặp thời gian nghỉ phép (Q18)",
         "Khi nhân viên gửi đơn nghỉ từ ngày A đến ngày B, hệ thống phải kiểm tra xem khoảng [A, B] có giao thoa với bất kỳ đơn nghỉ nào có trạng thái `PENDING` hoặc `APPROVED` của chính nhân viên đó hay không. Nếu trùng, hệ thống trả mã lỗi HTTP 409 Conflict."),
        ("BR-05: Cơ chế Snapshot và bất biến khi khóa kỳ lương (Q21)",
         "Khi bảng lương tháng được chuyển sang trạng thái `LOCKED`, toàn bộ số liệu tiền lương, phụ cấp, ngày công được lưu thành snapshot cố định. Mọi hành vi yêu cầu tính toán lại trên kỳ đã khóa đều bị chặn ở tầng Service."),
        ("BR-06: Nguyên tắc an toàn dữ liệu và quyền riêng tư tiền lương (Q22)",
         "Người dùng mang vai trò `EMPLOYEE` chỉ được phép tra cứu thông tin phiếu lương của chính mình thông qua API xác thực Token JWT. Bất kỳ nỗ lực truy cập vào phiếu lương của nhân viên khác đều bị chặn với mã lỗi HTTP 403 Forbidden.")
    ]
    for r_title, r_desc in rules:
        p_r = doc.add_paragraph()
        p_r.paragraph_format.left_indent = Inches(0.2)
        p_r.paragraph_format.space_after = Pt(4)
        r_rt = p_r.add_run(r_title + "\n")
        r_rt.font.bold = True
        r_rt.font.size = Pt(10.5)
        r_rt.font.color.rgb = RGBColor(31, 78, 121)
        r_rd = p_r.add_run(r_desc)
        r_rd.font.size = Pt(10)

    doc.add_page_break()

    # -------------------------------------------------------------
    # CHƯƠNG 5: KẾT LUẬN & KẾ HOẠCH BÀI LÀM TUẦN 4
    # -------------------------------------------------------------
    c5 = doc.add_heading("CHƯƠNG 5. KẾT LUẬN & KẾ HOẠCH BÀI LÀM TUẦN 4", level=1)
    c5.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    doc.add_heading("5.1. Đánh giá kết quả đạt được trong Tuần 3", level=2)
    doc.add_paragraph(
        "Trong tuần làm việc thứ 3, Nhóm 07 đã hoàn thành xuất sắc các mục tiêu đề ra theo đúng yêu cầu chỉ đạo của Giảng viên hướng dẫn:"
    )
    
    achievements = [
        "Thiết kế thành công bộ câu hỏi khảo sát phân tích hệ thống gồm 28 câu hỏi chuyên sâu (vượt mức tối thiểu 20 câu).",
        "Xác định rõ ràng đối tượng được hỏi cho từng câu hỏi (Ban Giám đốc, Quản lý HR, Trưởng nhóm, Giảng viên/Nhân viên, Kế toán, Quản trị IT).",
        "Phân bổ câu hỏi chính xác và bao quát toàn bộ 8 module nghiệp vụ cốt lõi của Hệ thống HRM Trung tâm Ngoại ngữ Bình An.",
        "Áp dụng chuẩn xác các thang đo khoa học trong nghiên cứu hệ thống thông tin: Thang đo Likert 5 mức độ, Thang đo Định danh, Thang đo Thứ bậc, Thang đo Nhị phân và Thang đo Tần suất.",
        "Biên soạn 5 mẫu phiếu khảo sát thực tế sẵn sàng triển khai thu thập dữ liệu tại đơn vị ứng dụng.",
        "Thiết lập ma trận truy vết yêu cầu (RTM) và cụ thể hóa 6 quy tắc nghiệp vụ bất biến cài đặt trong cơ sở dữ liệu MySQL."
    ]
    for ach in achievements:
        p_a = doc.add_paragraph(style='List Bullet')
        r_a = p_a.add_run(ach)
        r_a.font.size = Pt(10.5)

    doc.add_heading("5.2. Kế hoạch công việc Tuần 4 (Mô tả chi tiết nghiệp vụ và Xây dựng sơ đồ phân tích)", level=2)
    doc.add_paragraph(
        "Bước sang Tuần 4, Nhóm 07 sẽ tiếp tục sử dụng toàn bộ kết quả khảo sát và ma trận yêu cầu đã được nghiệm thu trong tuần này "
        "để tiến hành giai đoạn Phân tích hệ thống chi tiết. Kế hoạch cụ thể như sau:"
    )
    
    t_next = doc.add_table(rows=5, cols=4)
    t_next.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_next, color="C0C0C0", sz="4")
    
    headers_next = ["Tuần", "Nội dung công việc trọng tâm", "Sản phẩm đầu ra dự kiến", "Thành viên phụ trách"]
    for i, h in enumerate(headers_next):
        t_next.rows[0].cells[i].text = h
    format_row(t_next.rows[0], is_header=True, bg_color="1F4E79", bold=True, font_size=10, align=WD_ALIGN_PARAGRAPH.CENTER)
    
    next_data = [
        ("Tuần 4", "Mô tả chi tiết bài toán nghiệp vụ cho toàn bộ các hoạt động của HTTT HRM doanh nghiệp", "Tài liệu đặc tả nghiệp vụ HRM chi tiết (Chương 2 Báo cáo)", "Cả nhóm (Bùi Minh Quang chủ trì)"),
        ("Tuần 5", "Xây dựng sơ đồ phân rã chức năng (BFD), sơ đồ ngữ cảnh (Context Diagram) và Use Case Diagram", "Tệp thiết kế sơ đồ BFD, sơ đồ ngữ cảnh chuẩn và danh sách Use Case", "Nguyễn Thái Quân, Đỗ Vĩ Ngạn"),
        ("Tuần 6", "Xây dựng sơ đồ luồng dữ liệu (DFD) mức đỉnh và mức dưới đỉnh; hoàn thiện mô hình dữ liệu quan hệ", "Sơ đồ DFD mức 0, từ điển dữ liệu (Data Dictionary), Lược đồ quan hệ", "Lưu Chấn Hào, Nguyễn Trường Thành"),
        ("Tuần 7", "Triển khai cài đặt hệ thống phần mềm (Backend Spring Boot, Frontend React, MySQL, Docker)", "Source code chạy được và kết nối CSDL thành công", "Cả nhóm")
    ]
    
    col_widths_next = [Inches(0.8), Inches(2.8), Inches(2.3), Inches(1.5)]
    for r_idx, row_val in enumerate(next_data, start=1):
        row = t_next.rows[r_idx]
        for c_idx, val in enumerate(row_val):
            row.cells[c_idx].text = val
            row.cells[c_idx].width = col_widths_next[c_idx]
        bg = "F9FAFC" if r_idx % 2 == 1 else "FFFFFF"
        format_row(row, is_header=False, bg_color=bg, font_size=9.5)
        row.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph("\n")
    p_sign = doc.add_paragraph()
    p_sign.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_sign.paragraph_format.space_before = Pt(18)
    r_s1 = p_sign.add_run("TP. Hồ Chí Minh, ngày 22 tháng 09 năm 2026\n")
    r_s1.font.italic = True
    r_s1.font.size = Pt(11)
    r_s2 = p_sign.add_run("ĐẠI DIỆN NHÓM 07 — NHÓM TRƯỞNG\n\n\n\n")
    r_s2.font.bold = True
    r_s2.font.size = Pt(11)
    r_s3 = p_sign.add_run("BÙI MINH QUANG")
    r_s3.font.bold = True
    r_s3.font.size = Pt(12)

    return doc

def main():
    print("Starting generation of Week 3 report...")
    doc = build_document()
    
    # Target files:
    # 1. docs/bao-cao-tuan-3-hrm-binh-an.docx
    # 2. 2. ĐỒ ÁN/2026.09.22 – BC DA/Nhom07_BaoCao_Tuan3_BangCauHoi_PhanTichHeThong.docx
    # 3. 2. ĐỒ ÁN/2026.09.22 – BC DA/Nhom7.docx
    # 4. Root level: D:\2. ĐỒ ÁN\2026.09.22 – BC DA\
    
    output_paths = [
        "docs/bao-cao-tuan-3-hrm-binh-an.docx",
        "2. ĐỒ ÁN/2026.09.22 – BC DA/Nhom07_BaoCao_Tuan3_BangCauHoi_PhanTichHeThong.docx",
        "2. ĐỒ ÁN/2026.09.22 – BC DA/Nhom7.docx",
        "D:/2. ĐỒ ÁN/2026.09.22 – BC DA/Nhom07_BaoCao_Tuan3_BangCauHoi_PhanTichHeThong.docx",
        "D:/2. ĐỒ ÁN/2026.09.22 – BC DA/Nhom7.docx"
    ]
    
    for path in output_paths:
        try:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            doc.save(path)
            print(f"Successfully saved: {path} (Size: {os.path.getsize(path)} bytes)")
        except Exception as e:
            print(f"Error saving {path}: {e}")

if __name__ == "__main__":
    main()
