import { useState, useRef, useEffect, useCallback } from "react";
import EmojiPicker from "emoji-picker-react";
import api from "../services/api";
import { getSocket } from "../services/socket";

const stickerPack = [
  "/stickers/laugh.png",
  "/stickers/wow.png",
  "/stickers/heart.png",
  "/stickers/thumbsup.png"
];

export default function MessageInput({ conversationId }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [showEmoji,setShowEmoji]=useState(false);
  const [showStickers,setShowStickers]=useState(false);
  const [showGif,setShowGif]=useState(false);
  const [gifResults,setGifResults]=useState([]);
  const [gifQuery,setGifQuery]=useState("");

  const isTypingRef = useRef(false);
  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    return () => { clearTimeout(timerRef.current); emitTyping(false); };
  }, [conversationId]);

  useEffect(() => {
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [conversationId]);

  function emitTyping(v) {
    const s = getSocket(); if (!s) return;
    s.emit("typing", { conversationId, isTyping: v });
  }

  function handleChange(e) {
    setText(e.target.value);
    const ta = textareaRef.current;

    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight,120)+"px";
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(true);
    }

    clearTimeout(timerRef.current);
    timerRef.current=setTimeout(()=>{
      isTypingRef.current=false;
      emitTyping(false);
    },1500);
  }

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    clearTimeout(timerRef.current);
    isTypingRef.current=false;
    emitTyping(false);

    setSending(true);
    setText("");

    if (textareaRef.current) textareaRef.current.style.height="auto";

    try {
      const res = await api.post("/messages", {
        conversation_id:conversationId,
        content:trimmed
      });

      const socket=getSocket();
      if(socket) socket.emit("send_message",res.data);

      window.dispatchEvent(
        new CustomEvent("chatty:message_sent",{detail:res.data})
      );

    } catch(err){
      console.error(err);
      setText(trimmed);
    } finally {
      setSending(false);
      requestAnimationFrame(()=>textareaRef.current?.focus());
    }

  },[text,sending,conversationId]);

  function handleKey(e){
    if(e.key==="Enter" && !e.shiftKey){
      e.preventDefault();
      send();
    }
  }

  const hasText=text.trim().length>0;

  /* ------------------ Emoji ------------------ */

  function addEmoji(e){
    setText(prev=>prev+e.emoji);
  }

  /* ------------------ Sticker ------------------ */

  async function sendSticker(url){
    try{
      const res = await api.post("/messages",{
        conversation_id:conversationId,
        content:url
      });

      const socket=getSocket();
      if(socket) socket.emit("send_message",res.data);

    }catch(err){console.error(err)}

    setShowStickers(false);
  }

  /* ------------------ GIF ------------------ */

  async function searchGif(q){

    setGifQuery(q);

    if(!q) return;

    const res=await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${q}&limit=12`
    );

    const data=await res.json();
    setGifResults(data.data);
  }

  async function sendGif(url){

    const res = await api.post("/messages",{
      conversation_id:conversationId,
      content:url
    });

    const socket=getSocket();
    if(socket) socket.emit("send_message",res.data);

    setShowGif(false);
  }

  return (
    <>
      {/* Emoji Picker */}
      {showEmoji && (
        <div style={s.popup}>
          <EmojiPicker onEmojiClick={addEmoji}/>
        </div>
      )}

      {/* Sticker Panel */}
      {showStickers && (
        <div style={s.popup}>
          <div style={s.stickerGrid}>
            {stickerPack.map(sticker=>(
              <img
                key={sticker}
                src={sticker}
                style={s.sticker}
                onClick={()=>sendSticker(sticker)}
              />
            ))}
          </div>
        </div>
      )}

      {/* GIF Panel */}
      {showGif && (
        <div style={s.popup}>
          <input
            placeholder="Search GIF"
            value={gifQuery}
            onChange={(e)=>searchGif(e.target.value)}
            style={s.gifSearch}
          />

          <div style={s.gifGrid}>
            {gifResults.map(g=>(
              <img
                key={g.id}
                src={g.images.fixed_height.url}
                style={s.gif}
                onClick={()=>sendGif(g.images.original.url)}
              />
            ))}
          </div>
        </div>
      )}

      <div style={s.bar}>

        {/* Attach */}
        <button style={s.iconBtn}>📎</button>

        <div style={s.inputWrap}>
          <textarea
            ref={textareaRef}
            style={s.textarea}
            placeholder="Message"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKey}
            rows={1}
            disabled={sending}
          />

          {/* Emoji */}
          <button
            style={s.emojiBtn}
            onClick={()=>{
              setShowEmoji(!showEmoji);
              setShowStickers(false);
              setShowGif(false);
            }}
          >😀</button>

          {/* Stickers */}
          <button
            style={s.emojiBtn}
            onClick={()=>{
              setShowStickers(!showStickers);
              setShowEmoji(false);
              setShowGif(false);
            }}
          >🧸</button>

          {/* GIF */}
          <button
            style={s.emojiBtn}
            onClick={()=>{
              setShowGif(!showGif);
              setShowEmoji(false);
              setShowStickers(false);
            }}
          >GIF</button>

        </div>

        <button
          style={{
            ...s.sendBtn,
            background:hasText?"var(--accent)":"var(--bg-input)"
          }}
          onClick={send}
          disabled={!hasText || sending}
        >
          {hasText ? "➤" : "🎤"}
        </button>

      </div>
    </>
  );
}

const s={
  bar:{
    display:"flex",
    alignItems:"flex-end",
    gap:8,
    padding:"8px 12px 10px",
    background:"var(--bg-header)",
    borderTop:"1px solid var(--border)"
  },

  iconBtn:{
    width:40,
    height:40,
    borderRadius:"50%",
    background:"none",
    display:"flex",
    alignItems:"center",
    justifyContent:"center"
  },

  inputWrap:{
    flex:1,
    background:"var(--bg-input)",
    borderRadius:22,
    padding:"0 8px 0 16px",
    display:"flex",
    alignItems:"center",
    border:"1px solid var(--border)"
  },

  textarea:{
    flex:1,
    padding:"11px 0",
    background:"transparent",
    resize:"none",
    maxHeight:120
  },

  emojiBtn:{
    width:34,
    height:34,
    borderRadius:"50%",
    background:"none"
  },

  sendBtn:{
    width:44,
    height:44,
    borderRadius:"50%",
    border:"none"
  },

  popup:{
    position:"absolute",
    bottom:70,
    left:60,
    width:320,
    maxHeight:360,
    background:"#1f1f1f",
    borderRadius:12,
    padding:10,
    overflowY:"auto"
  },

  stickerGrid:{
    display:"grid",
    gridTemplateColumns:"repeat(4,1fr)",
    gap:10
  },

  sticker:{
    width:60,
    cursor:"pointer"
  },

  gifSearch:{
    width:"100%",
    padding:6,
    marginBottom:8
  },

  gifGrid:{
    display:"grid",
    gridTemplateColumns:"repeat(3,1fr)",
    gap:6
  },

  gif:{
    width:"100%",
    cursor:"pointer"
  }
};