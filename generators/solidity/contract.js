/**
 * @fileoverview Helper functions for generating Solidity for blocks.
 * @author jeanmarc.leroux@google.com (Jean-Marc Le Roux)
 */
'use strict';

goog.require('Blockly.Solidity');

Blockly.Solidity['contract'] = function(block) {
  var states = Blockly.Solidity.statementToCode(block, 'STATES');
  var ctor = Blockly.Solidity.statementToCode(block, 'CTOR');
  var methods = Blockly.Solidity.statementToCode(block, 'METHODS');
  var code = 'pragma solidity ^0.4.2;\n\n'
    + 'contract ' + block.getFieldValue('NAME') + ' {\n'
    + states
    + "  function () { throw; }\n"
    + ctor
    + methods
    + '}\n';

  return code;
};

Blockly.Solidity['contract_state'] = function(block) {
  var name = block.getFieldValue('NAME');
  var value = Blockly.Solidity.valueToCode(block, 'VALUE', Blockly.Solidity.ORDER_ASSIGNMENT);
  var type = block.getFieldValue('TYPE');
  var types = {
    'TYPE_BOOL': 'bool',
    'TYPE_INT': 'int',
    'TYPE_UINT': 'uint',
  };
  var defaultValue = {
    'TYPE_BOOL': 'false',
    'TYPE_INT': '0',
    'TYPE_UINT': '0',
  };

  if (value === '') {
    value = defaultValue[type];
  }

  return types[type] + ' ' + name + ' = ' + value + ';\n';
};

Blockly.Solidity['contract_method'] = function(block) {
  var params = Blockly.Solidity.statementToCode(block, 'PARAMS').trim();
  var branch = Blockly.Solidity.statementToCode(block, 'STACK');
  var code = 'function ' + block.getFieldValue('NAME') + '(' + params + ') {\n' + branch + '}\n';

  return code;
};

Blockly.Solidity['contract_ctor'] = function(block) {
  var parent = block.getSurroundParent();

  if (!parent) {
    return '';
  }

  var params = Blockly.Solidity.statementToCode(block, 'PARAMS').trim();
  var branch = Blockly.Solidity.statementToCode(block, 'STACK');
  var code = 'function ' + parent.getFieldValue('NAME') + '(' + params + ') {\n' + branch + '}\n';

  return code;
};

Blockly.Solidity['contract_method_parameter'] = function(block) {
  var name = block.getFieldValue('NAME');
  var nextBlock = block.getNextBlock();
  var sep = nextBlock && nextBlock.type == block.type ? ', ' : '';
  var types = {
    'TYPE_BOOL': 'bool',
    'TYPE_INT': 'int',
    'TYPE_UINT': 'uint',
  };

  return types[block.getFieldValue('TYPE')] + ' ' + name + sep;
};

Blockly.Solidity['contract_state_get'] = function(block) {
  var variableId = block.getFieldValue('STATE_NAME');
  var variable = block.workspace.getVariableById(variableId);

  if (!variable) {
    return '';
  }

  var variableName = variable.name.replace(Blockly.Solidity.CONTRACT_SCOPE_PREFIX_FUNC(block), '');

  return ['this.' + variableName, Blockly.Solidity.ORDER_ATOMIC];
};

Blockly.Solidity['contract_state_set'] = function(block) {
  // Variable setter.
  var argument0 = Blockly.Solidity.valueToCode(block, 'STATE_VALUE',
      Blockly.Solidity.ORDER_ASSIGNMENT) || '0';
  var variableId = block.getFieldValue('STATE_NAME');
  var variable = block.workspace.getVariableById(variableId);

  if (!variable) {
    return '';
  }

  var variableName = variable.name.replace(Blockly.Solidity.CONTRACT_SCOPE_PREFIX_FUNC(block), '');

  return 'this.' + variableName + ' = ' + argument0 + ';\n';
};

Blockly.Solidity['contract_method_parameter_get'] = function(block) {
  var variableId = block.getFieldValue('PARAM_NAME');
  var variable = block.workspace.getVariableById(variableId);

  if (!variable) {
    return '';
  }

  var variableName = variable.name.replace(Blockly.Solidity.METHOD_SCOPE_PREFIX_FUNC(block), '');

  return [variableName, Blockly.Solidity.ORDER_ATOMIC];
};
