import Dialog from "@mui/material/Dialog";
import { ReactNode } from "react";

interface ContextDialogProps {
  open: boolean;
  onClose: () => void;
  content: string;
  title: string;
}

export const ContextDialog = (props: ContextDialogProps) => {
  const { open, onClose, content, title } = props;

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-4">
        <h1 className="text-center">Source: {title}</h1>
        <div dangerouslySetInnerHTML={{__html: content}}></div>
      </div>
    </Dialog>
  );
};
