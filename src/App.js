import React, { useState } from "react";
import axios from "axios";
import SimpleLiner from "./SimpleLiner";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import DSLtab from "./DSLtab";

function App() {
  return (
    <Tabs variant="enclosed">
      <TabList>
        <Tab>DSL</Tab>
        <Tab>Upload File</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <DSLtab />
        </TabPanel>
        <TabPanel>
          <SimpleLiner />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

export default App;
