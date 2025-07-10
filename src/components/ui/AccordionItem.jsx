import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronRight } from "react-icons/fa"; // Usaremos una flecha derecha para un look más limpio

const AccordionItem = ({ title, children, defaultOpen = false, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-5 px-1 text-left"
      >
        <div className="flex items-center gap-4">
          {Icon && <Icon className="text-blue-500" size={20} />}
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {title}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-500"
        >
          <FaChevronRight />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pb-5 px-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccordionItem;