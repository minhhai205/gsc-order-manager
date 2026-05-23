package com.httt.gsc_order_manager.service;

import java.nio.charset.StandardCharsets;
import org.springframework.stereotype.Service;

@Service
public class SimplePdfService {

    public byte[] createSinglePagePdf(String title, String body) {
        String text = (title + "\n\n" + body).replace("\r", "");
        String escapedText = escapePdfText(text).replace("\n", ") Tj T* (");
        String stream = "BT /F1 12 Tf 50 760 Td (" + escapedText + ") Tj ET";

        String object1 = "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n";
        String object2 = "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n";
        String object3 = "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            + "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n";
        String object4 = "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n";
        String object5 = "5 0 obj << /Length " + stream.getBytes(StandardCharsets.US_ASCII).length
            + " >> stream\n" + stream + "\nendstream endobj\n";

        String[] objects = {object1, object2, object3, object4, object5};
        StringBuilder pdf = new StringBuilder("%PDF-1.4\n");
        int[] offsets = new int[objects.length + 1];
        for (int i = 0; i < objects.length; i++) {
            offsets[i + 1] = pdf.toString().getBytes(StandardCharsets.US_ASCII).length;
            pdf.append(objects[i]);
        }
        int xrefOffset = pdf.toString().getBytes(StandardCharsets.US_ASCII).length;
        pdf.append("xref\n0 6\n");
        pdf.append("0000000000 65535 f \n");
        for (int i = 1; i < offsets.length; i++) {
            pdf.append(String.format("%010d 00000 n \n", offsets[i]));
        }
        pdf.append("trailer << /Size 6 /Root 1 0 R >>\n");
        pdf.append("startxref\n").append(xrefOffset).append("\n%%EOF");
        return pdf.toString().getBytes(StandardCharsets.US_ASCII);
    }

    private String escapePdfText(String text) {
        return text
            .replace("\\", "\\\\")
            .replace("(", "\\(")
            .replace(")", "\\)")
            .replaceAll("[^\\x09\\x0A\\x0D\\x20-\\x7E]", "?");
    }
}
