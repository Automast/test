import Image from 'next/image';

import ltIcon from '@/assets/images/icons/arrow-left.svg';
import gtIcon from '@/assets/images/icons/arrow-right.svg';

const Pagination: React.FC<{
  totalLength: number | undefined;
  limit: number | undefined;
  page: number | undefined;
  pageCount: number | undefined;
  pageClick: (page: number) => void;
}> = ({ totalLength, limit, page, pageCount, pageClick }) => {
  return (
    <div className="grid grid-cols-12 justify-between items-center text-sm">
      {totalLength === undefined && (
        <div className="lg:col-span-6 col-span-12 text-[#B5B7C0] text-center lg:text-start pb-2"></div>
      )}
      {totalLength !== undefined && totalLength !== 0 && (
        <div className="lg:col-span-6 col-span-12 text-[#B5B7C0] text-center lg:text-start pb-2">{`Showing data ${
          (page! - 1) * limit! + 1
        } to ${Math.min(totalLength, page! * limit!)} of ${totalLength} entries`}</div>
      )}
      {totalLength !== undefined && totalLength === 0 && (
        <div className="lg:col-span-6 col-span-12 text-[#B5B7C0] text-center lg:text-start pb-2">No Data</div>
      )}
      <div className="lg:col-span-6 col-span-12 flex lg:justify-end justify-center items-center text-xs pb-2">
        <div
          className="flex justify-center items-center px-2 py-1.5 border rounded-md border-gray-200 gap-1 mr-4 cursor-pointer"
          onClick={page! > 1 ? () => pageClick(page! - 1) : () => {}}
        >
          <Image src={ltIcon} alt="Previous" height={16} />
          Previous
        </div>
        {pageCount! >= 1 && pageCount! <= 7 && (
          <>
            {Array.from({ length: pageCount! }, (_, i) => i + 1).map((ele) => (
              <div
                className={`flex justify-center items-center h-full min-w-8 p-2 rounded-md mx-1 cursor-pointer ${
                  ele === page ? 'bg-gray-200 text-black' : 'text-gray-600'
                }`}
                key={ele}
                onClick={() => pageClick(ele)}
              >
                {ele}
              </div>
            ))}
          </>
        )}
        {pageCount! >= 8 && (page === 1 || page === 2) && (
          <>
            <div
              className={`flex justify-center items-center h-full min-w-8 p-2 rounded-md mx-1 cursor-pointer ${
                1 === page ? 'bg-gray-200 text-black' : 'text-gray-600'
              }`}
              key={1}
              onClick={() => pageClick(1)}
            >
              {1}
            </div>
            <div
              className={`flex justify-center items-center h-full min-w-8 p-2 rounded-md mx-1 cursor-pointer ${
                2 === page ? 'bg-gray-200 text-black' : 'text-gray-600'
              }`}
              key={2}
              onClick={() => pageClick(2)}
            >
              {2}
            </div>
            <div className="ellipse flex justify-center items-center min-w-8 mx-1">...</div>
            <div
              className={`flex justify-center items-center h-full min-w-8 p-2 rounded-md mx-1 cursor-pointer ${
                pageCount === page ? 'bg-gray-200 text-black' : 'text-gray-600'
              }`}
              key={pageCount}
              onClick={() => pageClick(pageCount!)}
            >
              {pageCount}
            </div>
          </>
        )}
        {pageCount! >= 8 && (page === pageCount || page === pageCount! - 1) && (
          <>
            <div
              className={`flex justify-center items-center h-full min-w-8 p-2 rounded-md mx-1 cursor-pointer ${
                1 === page ? 'bg-gray-200 text-black' : 'text-gray-600'
              }`}
              key={1}
              onClick={() => pageClick(1)}
            >
              {1}
            </div>
            <div className="ellipse flex justify-center items-center min-w-8 mx-1">...</div>
            <div
              className={`flex justify-center items-center h-full min-w-8 p-2 rounded-md mx-1 cursor-pointer ${
                pageCount! - 1 === page ? 'bg-gray-200 text-black' : 'text-gray-600'
              }`}
              key={pageCount! - 1}
              onClick={() => pageClick(pageCount! - 1)}
            >
              {pageCount! - 1}
            </div>
            <div
              className={`flex justify-center items-center h-full min-w-8 p-2 rounded-md mx-1 cursor-pointer ${
                pageCount === page ? 'bg-gray-200 text-black' : 'text-gray-600'
              }`}
              key={pageCount}
              onClick={() => pageClick(pageCount!)}
            >
              {pageCount}
            </div>
          </>
        )}
        {pageCount! >= 8 && page! + 1 < pageCount! && page! - 1 > 1 && (
          <>
            <div
              className={`flex justify-center items-center h-full min-w-8 p-2 rounded-md mx-1 cursor-pointer ${
                1 === page ? 'bg-gray-200 text-black' : 'text-gray-600'
              }`}
              key={1}
              onClick={() => pageClick(1)}
            >
              {1}
            </div>
            <div className="ellipse flex justify-center items-center min-w-8 mx-1">...</div>
            <div
              className={`flex justify-center items-center h-full min-w-8 p-2 rounded-md mx-1 cursor-pointer ${
                page === page ? 'bg-gray-200 text-black' : 'text-gray-600'
              }`}
              key={page}
              onClick={() => pageClick(page!)}
            >
              {page}
            </div>
            <div className="ellipse flex justify-center items-center min-w-8 mx-1">...</div>
            <div
              className={`flex justify-center items-center h-full min-w-8 p-2 rounded-md mx-1 cursor-pointer ${
                pageCount === page ? 'bg-gray-200 text-black' : 'text-gray-600'
              }`}
              key={pageCount}
              onClick={() => pageClick(pageCount!)}
            >
              {pageCount}
            </div>
          </>
        )}
        <div
          className="flex justify-center items-center px-2 py-1.5 border rounded-md border-gray-200 gap-1 ml-4 cursor-pointer"
          onClick={page === pageCount ? () => {} : () => pageClick(page! + 1)}
        >
          Next
          <Image src={gtIcon} alt="Next" height={16} />
        </div>
      </div>
    </div>
  );
};

export default Pagination;
