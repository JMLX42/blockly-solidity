/**
 * @fileoverview Helper functions for generating Solidity for blocks.
 * @author jeanmarc.leroux@google.com (Jean-Marc Le Roux)
 */
'use strict';

goog.require('Blockly.Solidity');

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

Blockly.Solidity['contract_method_parameter_get'] = function(block) {
  var variableId = block.getFieldValue('PARAM_NAME');
  var variable = block.workspace.getVariableById(variableId);

  if (!variable) {
    return '';
  }

  return [Blockly.Solidity.getVariableName(variable), Blockly.Solidity.ORDER_ATOMIC];
};

Blockly.Solidity['contract_intrinsic_sha3'] = function(block) {
  var argument0 = Blockly.Solidity.valueToCode(block, 'VALUE',
      Blockly.Solidity.ORDER_ASSIGNMENT) || '0';

  return ['sha3(' + argument0 + ')', Blockly.Solidity.ORDER_ATOMIC];
};

Blockly.Solidity['contract_method_call'] = function(block) {
  var variableId = block.getFieldValue('METHOD_NAME');
  var variable = block.workspace.getVariableById(variableId);

  if (!variable) {
    return '';
  }

  return 'this.' + Blockly.Solidity.getVariableName(variable) + '();\n';
};
