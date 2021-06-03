import React, { useState } from "react";
import { FiPlusSquare, FiSearch, FiChevronRight } from "react-icons/fi";

const Layout: React.FC = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <>
      <header className="flex justify-between py-2 pl-8 border border-gray-100 items-center">
        <div className="left-side">
          <div className="logo text-xl font-bold">TabNews</div>
        </div>

        <div className="right-side flex gap-4 items-center">
          <div className="search bg-gray-50 rounded-sm p-2 flex items-center">
            <input
              type="text"
              placeholder="Buscar por conteúdo"
              className="bg-transparent"
            />
            <FiSearch />
          </div>

          <button className="border-none bg-purple-500 rounded-sm flex items-center text-white py-2 px-3">
            <FiPlusSquare className="mr-2" />
            <span>Informar</span>
          </button>

          <div className="user-area flex items-center w-72 px-4">
            <div className="user-avatar">
              <img
                className="rounded-full h-9 w-9 mr-2 flex-shrink-0 "
                src="https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
                alt=""
              />
            </div>
            <span className="user-name text-sm flex-1">@nomedeusuario</span>

            <FiChevronRight size={22} />
          </div>
        </div>
      </header>

      <div className="content flex">
        <main className="ml-8 flex-1">{children}</main>

        <aside
          className="w-72 border-l p-4"
          style={{ height: "calc(100vh - 58px)" }}
        >
          teste
        </aside>
      </div>
    </>
  );
};

export default Layout;
