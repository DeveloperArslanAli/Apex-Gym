import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { apiClient } from '../api/client';

interface Message {
  sender: 'COACH' | 'MEMBER';
  text: string;
  time: string;
}

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadAdvice = async () => {
    try {
      const res = await apiClient.get('member/coach/advice');
      const advice = res.data;
      setMessages([
        {
          sender: 'COACH',
          text: `G'day! I am Coach Arnold. ${advice.advice} Remember: ${advice.postureAudit.tips}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdvice();
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      sender: 'MEMBER',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      let reply = "Train hard, brace your core, and eat clean. What exercise substitutions do you need today?";
      const lower = input.toLowerCase();

      if (lower.includes('squat') || lower.includes('knee')) {
        reply = "Push outward through your heels on squats. Keep your chest up to avoid hip flexion collapsing.";
      } else if (lower.includes('pain') || lower.includes('hurt')) {
        reply = "Stop training immediately! If you experience joint pain, I recommend substituting with bodyweight exercises or machine movements.";
      } else if (lower.includes('protein') || lower.includes('macro')) {
        reply = "Aim for 2g of protein per kg of bodyweight. Lean beef, chicken breast, fish, and eggs are best.";
      } else if (lower.includes('busy') || lower.includes('substitute')) {
        reply = "If the squat rack is busy, substitute with the hack squat machine or leg press to hit full knee flexion safely.";
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'COACH',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setTyping(false);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
      style={styles.container}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.msgBox,
              msg.sender === 'MEMBER' ? styles.msgBoxMember : styles.msgBoxCoach,
            ]}
          >
            <Text
              style={[
                styles.msgText,
                msg.sender === 'MEMBER' ? styles.msgTextMember : styles.msgTextCoach,
              ]}
            >
              {msg.text}
            </Text>
            <Text style={styles.msgTime}>
              {msg.sender === 'MEMBER' ? 'You' : 'Coach Arnold'} • {msg.time}
            </Text>
          </View>
        ))}

        {typing && (
          <View style={[styles.msgBox, styles.msgBoxCoach, styles.typingBox]}>
            <ActivityIndicator size="small" color="#cbd5e1" />
          </View>
        )}
      </ScrollView>

      {/* Input Console */}
      <View style={styles.inputArea}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask splits, diet, exercises..."
          placeholderTextColor="#475569"
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSend} disabled={!input.trim()} style={styles.sendButton}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  msgBox: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  msgBoxCoach: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  msgBoxMember: {
    backgroundColor: '#10b981',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  msgText: {
    fontSize: 12,
    lineHeight: 18,
  },
  msgTextCoach: {
    color: '#cbd5e1',
  },
  msgTextMember: {
    color: '#09090b',
    fontWeight: '500',
  },
  msgTime: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  typingBox: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  inputArea: {
    flexDirection: 'row',
    backgroundColor: '#09090b',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    padding: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#f8fafc',
    fontSize: 12,
    height: 40,
  },
  sendButton: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 40,
  },
  sendText: {
    color: '#09090b',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
