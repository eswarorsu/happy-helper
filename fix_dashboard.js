
import fs from 'fs';

const filePath = 'c:\\Users\\orsul\\.gemini\\antigravity\\scratch\\happy-helper\\src\\pages\\FounderDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const newEffect = `  useEffect(() => {
    // ---------------------------------------------------------
    // REAL-TIME LISTENER FOR CHAT REQUESTS & STATUS UPDATES
    // ---------------------------------------------------------
    if (profile?.id) {
      console.log("[REALTIME] Starting subscriptions for:", profile.id);
      
      const chatChannel = supabase
        .channel(\`chats-\${profile.id}\`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'chat_requests', 
          filter: \`founder_id=eq.\${profile.id}\` 
        }, handleChatUpdate)
        .subscribe();

      const notifChannel = supabase
        .channel(\`notifs-\${profile.id}\`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: \`user_id=eq.\${profile.id}\` 
        }, (payload) => {
          console.log('[REALTIME] New Notification Received:', payload.new);
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          
          if (soundEnabled) {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKfk77RiGwU7k9bx0H4qBSh+zPLaizsKGGS56+mnVRILSKHh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU2jdTy0oEtBSt+zPDajTwJFmW88eqoVRMKSKDh8bllHAU');
            audio.volume = 0.2;
            audio.play().catch(() => {});
          }

          toast({
            title: newNotif.title,
            description: newNotif.message,
            className: "bg-blue-600 text-white border-none shadow-lg"
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(chatChannel);
        supabase.removeChannel(notifChannel);
      };
    }
  }, [profile?.id]);

  async function handleChatUpdate(payload: any) {
    if (payload.eventType === 'UPDATE') {
      setChatRequests((prev) =>
        prev.map((req) => req.id === payload.new.id ? { ...req, ...payload.new } : req)
      );
      if (selectedChat?.id === payload.new.id) {
        setSelectedChat((prev) => prev ? { ...prev, ...payload.new } : null);
      }
    } else if (payload.eventType === 'INSERT') {
      const { data } = await supabase
        .from('chat_requests')
        .select(\`*, investor:profiles!chat_requests_investor_id_fkey(*), idea:ideas(*)\`)
        .eq('id', payload.new.id)
        .single();

      if (data) {
        setChatRequests(prev => [data, ...prev]);
        toast({
          title: "New Investor Interest!",
          description: \`\${data.investor?.name} is interested in \${data.idea?.title}\`,
          className: "bg-indigo-600 text-white"
        });
      }
    }
  }`;

// Use line numbers to find the range. Line 573 starts the effect.
// Line 662 ends it.
const lines = content.split('\n');
const startIndex = lines.slice(570, 580).findIndex(line => line.includes('useEffect(() => {'));
const absoluteStartIndex = startIndex !== -1 ? 570 + startIndex : -1;

const endIndex = lines.slice(655, 670).findIndex(line => line.includes('}, [profile?.id, selectedChat?.id]);'));
const absoluteEndIndex = endIndex !== -1 ? 655 + endIndex : -1;

if (absoluteStartIndex !== -1 && absoluteEndIndex !== -1) {
    const linesToKeepBefore = lines.slice(0, absoluteStartIndex);
    const linesToKeepAfter = lines.slice(absoluteEndIndex + 1);

    const newLines = [...linesToKeepBefore, newEffect, ...linesToKeepAfter];
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    console.log('File updated successfully using line indices!');
} else {
    console.error('Could not find markers by index.');
    console.log('Start index found:', absoluteStartIndex);
    console.log('End index found:', absoluteEndIndex);
}
