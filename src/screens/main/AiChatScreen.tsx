import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { RootState } from '../../store';
import {
  useGetChatConversationsQuery,
  useGetChatConversationQuery,
  useCreateChatConversationMutation,
  useSendChatMessageMutation,
  useGetSuggestedQuestionsQuery,
} from '../../store/api/apiSlice';

interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  context: string;
  lastMessageAt: string;
  messageCount: number;
  status: string;
}

type ChatContext = 'TAX' | 'ZUS' | 'INVOICE' | 'KPiR' | 'GENERAL';

const CONTEXT_OPTIONS: { value: ChatContext; label: string; icon: string }[] = [
  { value: 'GENERAL', label: 'Ogolne', icon: 'chat' },
  { value: 'TAX', label: 'Podatki', icon: 'account-balance' },
  { value: 'ZUS', label: 'ZUS', icon: 'security' },
  { value: 'INVOICE', label: 'Faktury', icon: 'receipt' },
  { value: 'KPiR', label: 'KPiR', icon: 'menu-book' },
];

const AiChatScreen: React.FC = () => {
  const { currentCompany } = useSelector((state: RootState) => state.company as any);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<ChatContext>('GENERAL');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Conversations list query
  const {
    data: conversations,
    isLoading: conversationsLoading,
    refetch: refetchConversations,
  } = useGetChatConversationsQuery(
    { companyId: currentCompany?.id },
    { skip: !currentCompany }
  );

  // Single conversation query (with messages)
  const {
    data: currentConversation,
    isLoading: conversationLoading,
    refetch: refetchConversation,
  } = useGetChatConversationQuery(
    { companyId: currentCompany?.id, conversationId: selectedConversationId },
    { skip: !currentCompany || !selectedConversationId }
  );

  // Suggested questions
  const { data: suggestedQuestions } = useGetSuggestedQuestionsQuery(
    { companyId: currentCompany?.id, context: selectedContext },
    { skip: !currentCompany }
  );

  const [createConversation] = useCreateChatConversationMutation();
  const [sendMessage] = useSendChatMessageMutation();

  const messages: ChatMessage[] = currentConversation?.messages || currentConversation?.data?.messages || [];
  const conversationList: Conversation[] = conversations?.data || conversations || [];
  const questionsList: string[] = suggestedQuestions?.data || suggestedQuestions || [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedConversationId) {
      await refetchConversation();
    } else {
      await refetchConversations();
    }
    setRefreshing(false);
  }, [selectedConversationId, refetchConversation, refetchConversations]);

  const handleCreateConversation = async () => {
    if (!currentCompany) return;

    try {
      const result = await createConversation({
        companyId: currentCompany.id,
        context: selectedContext,
        title: `Nowa rozmowa - ${CONTEXT_OPTIONS.find((c) => c.value === selectedContext)?.label || 'Ogolne'}`,
      }).unwrap();

      const newId = result?.data?.id || result?.id;
      if (newId) {
        setSelectedConversationId(newId);
      }
      refetchConversations();
    } catch (error: any) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentCompany) return;

    let conversationId = selectedConversationId;

    // If no conversation selected, create one first
    if (!conversationId) {
      try {
        const result = await createConversation({
          companyId: currentCompany.id,
          context: selectedContext,
          title: messageText.trim().slice(0, 60),
        }).unwrap();

        conversationId = result?.data?.id || result?.id;
        if (conversationId) {
          setSelectedConversationId(conversationId);
        }
      } catch (error: any) {
        console.error('Error creating conversation:', error);
        return;
      }
    }

    if (!conversationId) return;

    const textToSend = messageText.trim();
    setMessageText('');
    setIsSending(true);

    try {
      await sendMessage({
        companyId: currentCompany.id,
        conversationId,
        content: textToSend,
      }).unwrap();

      refetchConversation();
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessageText(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setMessageText(question);
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
    refetchConversations();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Przed chwila';
    if (diffHours < 24) return `${diffHours} godz. temu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Wczoraj';
    return date.toLocaleDateString('pl-PL');
  };

  // ----------- RENDER: Context Selector -----------
  const renderContextSelector = () => (
    <View style={styles.contextSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {CONTEXT_OPTIONS.map((ctx) => (
          <TouchableOpacity
            key={ctx.value}
            style={[
              styles.contextButton,
              selectedContext === ctx.value && styles.contextButtonActive,
            ]}
            onPress={() => setSelectedContext(ctx.value)}
          >
            <Icon
              name={ctx.icon as any}
              size={16}
              color={selectedContext === ctx.value ? '#FFF' : '#666'}
            />
            <Text
              style={[
                styles.contextButtonText,
                selectedContext === ctx.value && styles.contextButtonTextActive,
              ]}
            >
              {ctx.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // ----------- RENDER: Suggested Questions -----------
  const renderSuggestedQuestions = () => {
    if (!questionsList || questionsList.length === 0) return null;

    return (
      <View style={styles.suggestedSection}>
        <Text style={styles.suggestedTitle}>Sugerowane pytania</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {questionsList.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestedChip}
              onPress={() => handleSuggestedQuestion(question)}
            >
              <Icon name="lightbulb" size={14} color="#007AFF" />
              <Text style={styles.suggestedChipText} numberOfLines={2}>
                {question}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ----------- RENDER: Message Bubble -----------
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'USER';
    const isSystem = item.role === 'SYSTEM';

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageBubbleContainer, isUser ? styles.userContainer : styles.assistantContainer]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Icon name="smart-toy" size={20} color="#FFF" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isUser ? styles.userMessageTime : styles.assistantMessageTime]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  // ----------- RENDER: Conversation List -----------
  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const contextOption = CONTEXT_OPTIONS.find((c) => c.value === item.context);

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => setSelectedConversationId(item.id)}
      >
        <View style={styles.conversationIcon}>
          <Icon name={(contextOption?.icon as any) || 'chat'} size={24} color="#007AFF" />
        </View>
        <View style={styles.conversationContent}>
          <Text style={styles.conversationTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.conversationMeta}>
            <Text style={styles.conversationMessages}>
              {item.messageCount} wiadomosci
            </Text>
            <Text style={styles.conversationDate}>
              {formatDate(item.lastMessageAt)}
            </Text>
          </View>
        </View>
        <Icon name="chevron-right" size={20} color="#CCC" />
      </TouchableOpacity>
    );
  };

  // ----------- RENDER: Input Bar -----------
  const renderInputBar = () => (
    <View style={styles.inputBar}>
      <TextInput
        style={styles.messageInput}
        placeholder="Zadaj pytanie AI Ksiegowej..."
        value={messageText}
        onChangeText={setMessageText}
        multiline
        maxLength={2000}
        editable={!isSending}
      />
      <TouchableOpacity
        style={[styles.sendButton, (!messageText.trim() || isSending) && styles.sendButtonDisabled]}
        onPress={handleSendMessage}
        disabled={!messageText.trim() || isSending}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Icon name="send" size={22} color="#FFF" />
        )}
      </TouchableOpacity>
    </View>
  );

  // ----------- NO COMPANY -----------
  if (!currentCompany) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="business" size={64} color="#CCC" />
        <Text style={styles.emptyText}>Wybierz firme, aby korzystac z AI Ksiegowej</Text>
      </View>
    );
  }

  // ----------- CHAT VIEW (conversation selected) -----------
  if (selectedConversationId) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToList}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderTitle} numberOfLines={1}>
              {currentConversation?.title || currentConversation?.data?.title || 'Rozmowa'}
            </Text>
            <Text style={styles.chatHeaderSubtitle}>AI Ksiegowa</Text>
          </View>
          {renderContextSelector()}
        </View>

        {/* Suggested Questions */}
        {messages.length === 0 && renderSuggestedQuestions()}

        {/* Messages */}
        {conversationLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Ladowanie rozmowy...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Icon name="smart-toy" size={48} color="#CCC" />
                <Text style={styles.emptyChatText}>
                  Rozpocznij rozmowe z AI Ksiegowa
                </Text>
                <Text style={styles.emptyChatSubtext}>
                  Zapytaj o podatki, ZUS, faktury lub inne zagadnienia ksiegowe
                </Text>
              </View>
            }
          />
        )}

        {/* Typing Indicator */}
        {isSending && (
          <View style={styles.typingIndicator}>
            <View style={styles.avatarContainerSmall}>
              <Icon name="smart-toy" size={14} color="#FFF" />
            </View>
            <Text style={styles.typingText}>AI Ksiegowa pisze...</Text>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}

        {/* Input Bar */}
        {renderInputBar()}
      </KeyboardAvoidingView>
    );
  }

  // ----------- CONVERSATION LIST VIEW -----------
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>AI Ksiegowa</Text>
        <Text style={styles.headerSubtitle}>
          Asystent ksiegowy oparty na sztucznej inteligencji
        </Text>
      </View>

      {/* Context Selector */}
      {renderContextSelector()}

      {/* New Conversation Button */}
      <TouchableOpacity style={styles.newConversationButton} onPress={handleCreateConversation}>
        <Icon name="add-comment" size={22} color="#FFF" />
        <Text style={styles.newConversationText}>Nowa rozmowa</Text>
      </TouchableOpacity>

      {/* Suggested Questions */}
      {renderSuggestedQuestions()}

      {/* Conversations List */}
      {conversationsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Ladowanie rozmow...</Text>
        </View>
      ) : conversationList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="chat-bubble-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Brak rozmow</Text>
          <Text style={styles.emptySubtext}>
            Rozpocznij nowa rozmowe z AI Ksiegowa, aby uzyskac pomoc w sprawach ksiegowych
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversationList}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.conversationList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Quick Start Input */}
      {renderInputBar()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },

  // Context Selector
  contextSelector: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  contextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    gap: 6,
  },
  contextButtonActive: {
    backgroundColor: '#007AFF',
  },
  contextButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  contextButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },

  // New Conversation Button
  newConversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  newConversationText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Suggested Questions
  suggestedSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  suggestedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
    maxWidth: 220,
  },
  suggestedChipText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    flexShrink: 1,
  },

  // Conversation List
  conversationList: {
    paddingVertical: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  conversationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationMessages: {
    fontSize: 12,
    color: '#999',
  },
  conversationDate: {
    fontSize: 12,
    color: '#999',
  },

  // Chat Header
  chatHeader: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 0,
  },
  chatHeaderInfo: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chatHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // Messages
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexGrow: 1,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  avatarContainerSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#E8E8E8',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userMessageText: {
    color: '#FFF',
  },
  assistantMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  assistantMessageTime: {
    color: '#999',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },

  // Empty Chat
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyChatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyChatSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 19,
  },

  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 6,
  },
  typingText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    gap: 8,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: '#FAFAFA',
    color: '#333',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
});

export default AiChatScreen;
