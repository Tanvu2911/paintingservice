import moment from "moment";

export const moneyFormatConverter = (num) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(num);
};

export const prepareIncomeChartData = (transactions) => {
    const result = Object.values(
        transactions.reduce((acc, transaction) => {
            if (!acc[transaction.date]) {
                acc[transaction.date] = {
                    date: transaction.date,
                    totalAmount: 0,
                    items: [],
                    month: "",
                };
            }
            acc[transaction.date].totalAmount += transaction.amount;
            acc[transaction.date].items.push(transaction);
            acc[transaction.date].month = moment(transaction.date).format(
                "DD/MM/YYYY",
            );
            return acc;
        }, {}),
    );
    return result;
};
