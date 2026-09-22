import TransactionRow from '@/components/TransactionRow';
import { useDeleteTransaction } from '@/hooks/mutations/useTransactionsMutation';
import { useAccountsQuery } from '@/hooks/queries/useAccountsQuery';
import { useTransactionsQuery } from '@/hooks/queries/useTransactionsQuery';
import { exportTransaction } from '@/lib/exportTransaction';
import { Transaction, TransactionType } from '@/types';
import { Feather } from '@expo/vector-icons';
import { eachDayOfInterval, format, startOfDay, startOfDecade, startOfMonth } from 'date-fns';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { FlatList, RefreshControl, ScrollView, TextInput } from 'react-native-gesture-handler';
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

const FILTERS = ["All", "Income", "Expense"] as const;

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function currentMonthDays() {
  const today = startOfDay(new Date());
  return eachDayOfInterval({ start: startOfMonth(today), end: today }).map(
    (d) => ({ key: dayKey(d), label: format(d, "d MMM") })
  );
}

export default function transactions() {
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeAccountId, setActiveAccountId] = useState(null)

  const router = useRouter();

  const typeFilter: TransactionType | null = activeFilter === "Income" ? "INCOME" : activeFilter === "Expense" ? "EXPENSE" : null;

  const { data: accounts = [], refetch: refetchAccounts } = useAccountsQuery();
  const {
    data: transactions = [],
    isLoading,
    isRefetching: refreshing,
    isError,
    refetch: refetchTransactions
  } = useTransactionsQuery({ type: typeFilter, accountId: activeAccountId });
  const { mutateAsync: deleteTransaction, error: deleteError } = useDeleteTransaction()

  const loadData = () => {
    refetchAccounts();
    refetchTransactions();
  }

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return transactions;

    return transactions.filter((transaction) => (
      transaction.description.toLowerCase().includes(query)) ||
      transaction.category.toLowerCase().includes(query)
    )
  }, [search, transactions]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { count } = await exportTransaction(transactions);
      if (count === 0) Alert.alert("Error", "No transactions to export.");
    } catch (error) {
      console.log("Error exporting transactions", error);
      Alert.alert("Error", "Couldn't export transactions.");
    } finally {
      setExporting(false);
    }
  }

  const handleDelete = (transaction: Transaction) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTransaction(transaction.id)
            if (deleteError) Alert.alert("Error", "Couldn't delete this transaction.");
          }
        }
      ]
    )
  }

  const dailyIncomeExpense = useMemo(() => {
    const days = currentMonthDays();
    return days.flatMap((day) => {
      const income = transactions.filter((transaction) => transaction.type === "INCOME" && day.key === dayKey(new Date(transaction.date)))
        .reduce((sum, transaction) => sum + transaction.amount, 0)

      const expense = transactions.filter((transaction) => transaction.type === "EXPENSE" && day.key === dayKey(new Date(transaction.date)))
        .reduce((sum, transaction) => sum + transaction.amount, 0)

      return [
        { value: income, label: day.label, frontColor: "#3DDC84" },
        { value: expense, label: day.label, frontColor: "#F87171" },
      ]
    })
  }, [transactions, search])

  const maxValue = useMemo(() => {
    if (dailyIncomeExpense.length === 0) return undefined;

    const values = dailyIncomeExpense.map((d) => d.value).sort((a, b) => a - b);
    const p90 = values[Math.floor(values.length * 0.9)];

    return p90 > 0 ? p90 : Math.max(...values);
  }, [dailyIncomeExpense]);

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-brand-bg text-xl font-semibold">
            Transactions
          </Text>
          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting}
            className="w-9 h-9 rounded-full bg-white border border-[#E8E6DF] items-center justify-center"
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#5C5F68" />
            ) : (
              <Feather name="download" size={15} color="#5C5F68" />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2 bg-white rounded-xl border border-[#E8E6DF] px-2 py-1 mb-2">
          <Feather name="search" size={15} color="#8A8D96" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions"
            placeholderTextColor="#8A8D96"
            className="flex-1 text-xs text-brand-bg"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={15} color="#8A8D96" />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row gap-2 mb-2.5">
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-full border ${activeFilter === filter
                ? "bg-brand-bg border-brand-bg"
                : "bg-white border-[#E8E6DF]"
                }`}
            >
              <Text
                className={`text-xs ${activeFilter === filter
                  ? "text-white"
                  : "text-brand-text-secondary"
                  }`}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setActiveAccountId(null)}
              className={`px-3.5 py-1.5 rounded-full border ${activeAccountId === null
                ? "bg-brand-bg border-brand-bg"
                : "bg-white border-[#E8E6DF]"
                }`}
            >
              <Text
                className={`text-xs ${activeAccountId === null
                  ? "text-white"
                  : "text-brand-text-secondary"
                  }`}
              >
                All Accounts
              </Text>
            </TouchableOpacity>
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                onPress={() => setActiveAccountId(account.id)}
                className={`px-3.5 py-1.5 rounded-full border ${activeAccountId === account.id
                  ? "bg-brand-bg border-brand-bg"
                  : "bg-white border-[#E8E6DF]"
                  }`}
              >
                <Text
                  className={`text-xs ${activeAccountId === account.id
                    ? "text-white"
                    : "text-brand-text-secondary"
                    }`}
                >
                  {account.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4A9EFF" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-10">
          <Feather name="alert-circle" size={32} color="#FF6B4A" />
          <Text className="text-brand-text-muted text-sm mt-3 text-center">
            Couldn&apos;t load transactions.
          </Text>
          <TouchableOpacity
            onPress={() => loadData()}
            className="mt-4 bg-brand-bg rounded-full px-4 py-2"
          >
            <Text className="text-white text-xs font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionRow transaction={item} onDelete={() => handleDelete(item)} />
          )}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadData} />
          }
          ListHeaderComponent={
            transactions.length > 0 ? (
              <View className="bg-white rounded-2xl border border-[#E8E6DF] p-4 mb-4">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-brand-bg text-xs font-medium">
                    Daily income vs expense
                  </Text>
                  <View className="flex-row gap-3">
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-brand-success" />
                      <Text className="text-[10px] text-brand-text-secondary">
                        Income
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-brand-coral" />
                      <Text className="text-[10px] text-brand-text-secondary">
                        Expense
                      </Text>
                    </View>
                  </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={dailyIncomeExpense}
                    width={Math.max(dailyIncomeExpense.length * 9, 280)}
                    maxValue={maxValue}
                    height={120}
                    barWidth={6}
                    spacing={4}
                    hideYAxisText
                    xAxisColor="#E8E6DF"
                    yAxisColor="transparent"
                    rulesColor="#F0EEE7"
                    noOfSections={3}
                    xAxisLabelTextStyle={{ color: "#8A8D96", fontSize: 7 }}
                    isThreeD={false}
                    roundedTop
                  />
                </ScrollView>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Feather name="inbox" size={32} color="#BDC3C7" />
              <Text className="text-brand-text-muted text-sm mt-3">
                {search ? "No matching transactions" : "No transactions yet"}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        onPress={() => router.push("/(root)/(tabs)/addTransaction")}
        className="absolute right-5 w-14 h-14 rounded-full bg-brand-bg items-center justify-center shadow-lg"
        style={{ bottom: 90 }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}