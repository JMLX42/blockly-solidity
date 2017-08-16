'use strict';

goog.provide('Blockly.Solidity.contract');

Blockly.Extensions.register(
  'declare_typed_variable',
  function() {
    var block = this;

    this.declareVariable = function(name, force = false) {
      var oldName = block.getFieldValue('NAME');

      if (!force && (!block.getParent() || oldName == name)) {
        return oldName;
      }

      var type = block.getFieldValue('TYPE');
      var prefix = this.getVariablePrefix(block);
      var variable = block.workspace.getVariableById(block.id);

      if (!block.workspace.getVariable(prefix + name)) {
        newName = name;
      } else {
        var count = 1;
        var newName = name + count;
        while (block.workspace.getVariable(prefix + newName)) {
          count++;
          newName = name + count;
        }
      }

      if (!variable) {
        block.workspace.createVariable(prefix + newName, type, block.id);
      } else {
        variable.name = prefix + newName;
      }

      if (force) {
        block.getField('NAME').setText(newName);
      }

      Blockly.Solidity.updateWorkspaceParameterNameFields(block.workspace);

      return newName;
    };

    this.getVariableNameField().setValidator(function(name) {
      return block.declareVariable(name);
    });

    var onchange = null;
    if (goog.isFunction(this.onchange)) {
      onchange = this.onchange;
    }

    this.setOnChange(function(event) {
      Blockly.Solidity.updateWorkspaceStateNameFields(this.workspace);
      Blockly.Solidity.updateWorkspaceStateTypes(this.workspace);
      Blockly.Solidity.updateWorkspaceParameterNameFields(this.workspace);
      Blockly.Solidity.updateWorkspaceParameterTypes(this.workspace);

      if (event.type == "move" && !!event.newParentId) {
        if (!this.workspace.getVariableById(this.id)) {
          this.declareVariable(this.getFieldValue('NAME'), true);
        }
      }
      if (event.element == "field" && event.name == "TYPE") {
        var variable = this.workspace.getVariableById(this.id);

        variable.type = this.getFieldValue('TYPE');
        Blockly.Solidity.updateWorkspaceStateTypes(this.workspace);
      }

      if (!!onchange) {
        onchange.call(block, event);
      }
    });
  }
);

Blockly.defineBlocksWithJsonArray([
  {
    "type": "contract",
    "message0": 'smart contract %1',
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "check": "String",
        "text": "MyContract",
      }
    ],
    "message1": "states %1",
    "args1": [
      {
        "type": "input_statement",
        "name": "STATES",
        "check": ["contract_state"],
        "align": "RIGHT"
      }
    ],
    "message2": "constructor %1",
    "args2": [
      {
        "type": "input_statement",
        "name": "CTOR",
        "check": ["contract_ctor"],
        "align": "RIGHT"
      }
    ],
    "message3": "methods %1",
    "args3": [
      {
        "type": "input_statement",
        "name": "METHODS",
        "check": ["contract_method"],
        "align": "RIGHT"
      }
    ],
    "colour": 160,
    "tooltip": "Declares a new smart contract."
  }
]);

Blockly.Blocks['contract_state'] = {
  init: function() {
    var nameField = new Blockly.FieldTextInput('a');
    this.appendDummyInput()
        .appendField('let')
        .appendField(new Blockly.FieldDropdown([
            [ "bool", "TYPE_BOOL" ],
            [ "int",  "TYPE_INT" ],
            [ "uint", "TYPE_UINT" ],
          ]),
          'TYPE'
        )
        .appendField(nameField, 'NAME');
    this.setPreviousStatement(true, 'contract_state');
    this.setNextStatement(true, 'contract_state');
    this.setColour(195);
    this.contextMenu = false;

    this._stateNameInitialized = false;

    this.getVariablePrefix = Blockly.Solidity.CONTRACT_SCOPE_PREFIX_FUNC;
    this.getVariableNameField = function() { return nameField; }

    Blockly.Extensions.apply('declare_typed_variable', this, false);
  },
};

Blockly.Blocks['contract_state_get'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown([
          ["select state...", Blockly.Solidity.UNDEFINED_STATE_NAME],
        ]),
        "STATE_NAME"
      );
    this.setOutput(true, null);
    this.setColour(195);
  }
};

Blockly.Blocks['contract_state_set'] = {
  init: function() {
    this.appendValueInput('STATE_VALUE')
      .appendField("set")
      .appendField(
        new Blockly.FieldDropdown(
          [["select state...", Blockly.Solidity.UNDEFINED_STATE_NAME]],
          this.validate
        ),
        "STATE_NAME"
      )
      .appendField("to");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(195);
  },

  validate: function(stateNameVariableId) {
    var workspace = this.sourceBlock_.workspace;
    // FIXME: dirty hack to make sure updateWorkspaceStateTypes is called right after validate
    setTimeout(
      function() { Blockly.Solidity.updateWorkspaceStateTypes(workspace) },
      1
    );
    return stateNameVariableId;
  }
};

Blockly.Blocks['contract_method_parameter'] = {
  init: function() {
    var nameField = new Blockly.FieldTextInput('a');
    this.appendDummyInput()
        .appendField('let')
        .appendField(new Blockly.FieldDropdown([
            [ "bool", "TYPE_BOOL" ],
            [ "int",  "TYPE_INT" ],
            [ "uint", "TYPE_UINT" ],
          ]),
          'TYPE'
        )
        .appendField(nameField, 'NAME');
    this.setPreviousStatement(true, 'contract_method_parameter');
    this.setNextStatement(true, 'contract_method_parameter');
    this.setColour(320);
    this.contextMenu = false;

    this.getVariablePrefix = Blockly.Solidity.METHOD_SCOPE_PREFIX_FUNC;
    this.getVariableNameField = function() { return nameField };

    Blockly.Extensions.apply('declare_typed_variable', this, false);
  },
};

Blockly.Blocks['contract_method_parameter_get'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown([
          ["select param...", Blockly.Solidity.UNDEFINED_PARAM_NAME],
        ]),
        "PARAM_NAME"
      );
    this.setOutput(true, null);
    this.setColour(320);
  }
};

Blockly.defineBlocksWithJsonArray([
  {
    "type": "contract_method",
    "message0": "method %1",
    "args0": [
      {
        "type": "field_input",
        "name": "NAME",
        "text": "myMethod"
      },
    ],
    "message1": "parameters %1",
    "args1": [
      {
        "type": "input_statement",
        "name": "PARAMS",
        "check": ["contract_method_parameter"],
        "align": "RIGHT"
      },
    ],
    "message2": "code %1",
    "args2": [
      {
        "type": "input_statement",
        "name": "STACK",
        "align": "RIGHT"
      }
    ],
    "previousStatement": "contract_method",
    "nextStatement": "contract_method",
    "colour": 290,
    "tooltip": "",
    "helpUrl": ""
  }
]);

Blockly.defineBlocksWithJsonArray([
  {
    "type": "contract_ctor",
    "message0": "constructor",
    "message1": "parameters %1",
    "args1": [
      {
        "type": "input_statement",
        "name": "PARAMS",
        "check": "contract_method_parameter",
        "align": "RIGHT"
      },
    ],
    "message2": "code %1",
    "args2": [
      {
        "type": "input_statement",
        "name": "STACK",
        "align": "RIGHT"
      }
    ],
    "previousStatement": ["contract_ctor"],
    "colour": 290,
    "tooltip": "",
    "helpUrl": ""
  }
]);
