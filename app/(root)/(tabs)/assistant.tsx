import { useBudgetsQuery } from '@/hooks/queries/useBudgetsQuery';
import { useTransactionsQuery } from '@/hooks/queries/useTransactionsQuery';
import { askAssistant } from '@/lib/services/assistant';
import { userStore } from '@/store/userStore';
import { useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTED_PROMPTS = [
  "How much did I spend on food this month?",
  "What's my biggest expense this week?",
  "Am I over budget anywhere?",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi! Ask me anything about your spending or budgets in last 30 days.",
  },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View className={`mb-3 max-w-[85%] ${isUser ? "self-end" : "self-start"}`}>
      <View
        className={`rounded-2xl px-3.5 py-2.5 ${isUser ? "bg-brand-bg" : "bg-white border border-[#E8E6DF]"
          }`}
      >
        <Text className={`text-sm ${isUser ? "text-white" : "text-brand-bg"}`}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const insets = useSafeAreaInsets();

  const { user } = useUser();
  const currency = userStore((state) => state.currency)

  const { refetch: refetchTransactions } = useTransactionsQuery();
  const { refetch: refetchBudgets } = useBudgetsQuery();

  const sendPromptToAssistant = async (text: string) => {
    if (!text.trim() || loading || !user) return;
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: text }]);
    setPrompt('');
    setLoading(true);

    try {
      const [transactionsResult, budgetResult] = await Promise.all([refetchTransactions(), refetchBudgets()]);

      if (transactionsResult.error) throw transactionsResult.error;
      if (budgetResult.error) throw budgetResult.error;

      const transactions = transactionsResult.data ?? [];
      const budget = budgetResult.data ?? null;

      const response = await askAssistant(text, transactions, budget, currency);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: response }]);
    } catch (error) {
      console.error("Error sending prompt to assistant ", error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: "I'm sorry, something went wrong. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <View className="px-5 pt-3 pb-2" onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <Text className="text-brand-bg text-xl font-semibold">Assistant</Text>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top + headerHeight}
        className="flex-1"
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
          }}
          ListFooterComponent={
            loading ? (
              <View className="self-start mb-3 bg-white border border-[#E8E6DF] rounded-2xl px-3.5 py-2.5">
                <ActivityIndicator size="small" color="#4A9EFF" />
              </View>
            ) : null
          }
        />

        {messages.length <= 1 && (
          <View className="px-5 pb-2 gap-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => sendPromptToAssistant(p)}
                className="bg-white rounded-xl border border-[#E8E6DF] px-3.5 py-2.5 self-start"
              >
                <Text className="text-brand-text-secondary text-xs">
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View
          className="flex-row items-center gap-2 px-5 pt-2"
          style={{ paddingBottom: keyboardVisible ? insets.bottom + 200 : insets.bottom - 40 }}
        >
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ask about your money..."
            placeholderTextColor="#8A8D96"
            editable={!loading}
            className="flex-1 bg-white border border-[#E8E6DF] rounded-full px-4 py-3 text-sm text-brand-bg"
            onSubmitEditing={() => sendPromptToAssistant(prompt)}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => sendPromptToAssistant(prompt)}
            disabled={loading}
            className="w-11 h-11 rounded-full bg-brand-bg items-center justify-center"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Feather name="arrow-up" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}