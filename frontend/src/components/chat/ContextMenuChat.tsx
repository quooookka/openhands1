import React from 'react';
import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';
import { cn } from '#/utils/utils';
import { twMerge } from 'tailwind-merge';


interface ContextMenuChatProps {
  onOptionSelect: (option: string) => void;
}

const ContextMenuChat: React.FC<ContextMenuChatProps> = ({ onOptionSelect }) => {
  const options = ['创建新项目', '代码语言转换', '代码片段生成', '函数重构优化', '测试用例生成', '自定义'];

  return (
    <Menu
      menuButton={
        <MenuButton>
          <div className="cursor-pointer text-sm">模板</div>
        </MenuButton>
      }
      className={twMerge(
        'bg-[#404040] rounded-md w-[75px]',
        cn('text-white text-sm')
      )}
    >
      {options.map((option) => (
        <MenuItem key={option} onClick={() => onOptionSelect(option)}>
          {option}
        </MenuItem>
      ))}
    </Menu>
  );
};

export default ContextMenuChat;
