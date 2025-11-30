import DOMPurify from "dompurify";

const HTMLTextBox = ({ content }: { content: string }) => {
  return (
    <div
      className="prose prose-invert max-w-none prose-headings:text-primary prose-li:marker:text-primary prose-strong:text-primary"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
    />
  );
};

export default HTMLTextBox;
