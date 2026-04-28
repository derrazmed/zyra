import Icon from "./Icon.jsx";

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === "success" && <Icon name="check" size={14} />}
          {t.type === "error" && <Icon name="close" size={14} />}
          {t.type === "info" && <Icon name="notifications" size={14} />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
