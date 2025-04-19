import { Fragment } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { DirectoryChainItem } from './types';

type FileBreadcrumbMenuProps = {
  directoryChain: DirectoryChainItem[];
  onClick: (id: number | null) => void;
}

export default function FileBreadcrumbMenu({ directoryChain, onClick }: FileBreadcrumbMenuProps) {
  return (
    <div className='flex flex-row flex-wrap items-center gap-1.5 my-3 mx-2'>
      {directoryChain.map((x, index) => (
        <Fragment key={x.id}>
          {index > 0 && <FontAwesomeIcon icon={faChevronRight} />}
          <button
            className={
              index === directoryChain.length - 1
                ? 'text-black sm:text-lg md:text-xl'
                : 'text-gray-500 sm:text-lg md:text-xl'
            }
            onClick={() => onClick(x.id)}
          >
            {x.name}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
