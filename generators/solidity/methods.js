/**
 * @fileoverview Helper functions for generating Solidity for blocks.
 * @author jeanmarc.leroux@google.com (Jean-Marc Le Roux)
 */
'use strict';

goog.require('Blockly.Solidity');

Blockly.Solidity['method_declare'] = function(block) {
  var params = Blockly.Solidity.statementToCode(block, 'PARAMS').trim();
  var branch = Blockly.Solidity.statementToCode(block, 'STACK');
  var code = 'function ' + block.getFieldValue('NAME') + '(' + params + ') {\n' + branch + '}\n';

  return code;
};

Blockly.Solidity['method_ctor'] = function(block) {
  var parent = block.getSurroundParent();

  if (!parent) {
    return '';
  }

  var params = Blockly.Solidity.statementToCode(block, 'PARAMS').trim();
  var branch = Blockly.Solidity.statementToCode(block, 'STACK');
  var code = 'function ' + parent.getFieldValue('NAME') + ' (' + params + ') {\n' + branch + '}\n';

  return code;
};

Blockly.Solidity['method_parameter'] = function(block) {
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
