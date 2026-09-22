import { Transaction } from "@/types";
import { format } from "date-fns";
import { Directory, Paths, File } from "expo-file-system"
import * as Sharing from "expo-sharing";

function toCsvCell(value: string | number | null) {
    if (value === null) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
}

function buildCsv(transactions: Transaction[]) {
    const header = [
        "Date",
        "Type",
        "Category",
        "Description",
        "Amount",
        "Input Method",
    ];
    const rows = transactions.map((transaction) => [
        format(new Date(transaction.date), "yyyy-MM-dd"),
        transaction.type,
        transaction.category,
        transaction.description ?? "",
        transaction.amount,
        transaction.input_method,
    ]);

    return [header, ...rows]
        .map((row) => row.map(toCsvCell).join(","))
        .join("\n");
}

export async function exportTransaction(transactions: Transaction[]) {
    const csv = buildCsv(transactions);
    const fileName = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    const file = new File(new Directory(Paths.cache), fileName);
    if (file.exists) file.delete();
    file.create()
    file.write(csv)

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
            mimeType: "text/csv",
            dialogTitle: "Export transactions",
            UTI: "public.comma-separated-values-text",
        });
    }

    return {
        count: transactions.length,
        uri: file.uri
    }
}